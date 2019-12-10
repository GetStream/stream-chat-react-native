/* eslint-disable no-underscore-dangle */
/**
 * =======================================================================================
 * ==================== STILL IN PROGRESS ================================================
 * =======================================================================================
 */

import {
  convertChannelToStorable,
  convertMessageToStorable,
  convertUserToStorable,
} from './mappers';
import {
  getQueryKey,
  getChannelKey,
  getChannelMessagesKey,
  getChannelReadKey,
} from './keys';

const VALID_CHANNELS_SORT_KEYS = [
  'last_message_at',
  'updated_at',
  'created_at',
];

/**
 * Local storage interface based on AsyncStorage
 */
export class AsyncLocalStorage {
  constructor(AsyncStorage, userId) {
    this.asyncStorage = AsyncStorage;
    this.userId = userId;
    this.logger = () => {};
  }

  setLogger(logger) {
    this.logger = logger;
  }

  /**
   *
   * @param {*} query
   * @param {*} channels
   * @param {*} resync
   */
  async storeChannels(query, channels, resync) {
    const channelIds = channels.map((c) => getChannelKey(this.userId, c.id));

    const storables = {};
    channels.forEach(
      async (c) => await convertChannelToStorable(c, storables, this.userId),
    );

    if (resync) {
      storables[getQueryKey(this.userId, query)] = channelIds;
    } else {
      const existingChannelIds = await this.getItem(
        getQueryKey(this.userId, query),
        [],
      );

      storables[getQueryKey(this.userId, query)] = existingChannelIds.concat(
        channelIds,
      );
    }

    await this.multiSet(storables);
  }

  /**
   *
   * @param {*} key
   */
  async getItem(key, defaultValue) {
    const strValue = await this.asyncStorage.getItem(key);

    if (!strValue) return defaultValue;

    return JSON.parse(strValue);
  }

  /**
   *
   * @param {*} key
   */
  async setItem(key, value) {
    return await this.asyncStorage.setItem(key, JSON.stringify(value));
  }

  /**
   *
   * @param {*} storables
   */
  async multiSet(storables) {
    const storablesArray = [];

    for (const key in storables) {
      storablesArray.push([key, JSON.stringify(storables[key])]);
    }

    return await this.asyncStorage.multiSet(storablesArray);
  }

  async deleteAll() {
    const allKeys = await this.asyncStorage.getAllKeys();
    const streamKeys = allKeys.filter((k) => k.indexOf('getstream:chat') === 0);

    return this.asyncStorage.multiRemove(streamKeys);
  }

  close() {}

  /**
   *
   * @param {*} query
   */
  async queryChannels(query, sort, offset, limit) {
    const channelIds = await this.getChannelIdsForQuery(query);
    if (!channelIds) return [];

    let channels = await this.getChannels(channelIds);
    const sortKeys = Object.keys(sort);

    channels.sort((a, b) => {
      let answer = 0;
      sortKeys.forEach((sortKey) => {
        if (VALID_CHANNELS_SORT_KEYS.indexOf(sortKey) === -1) {
          return;
        }

        answer =
          answer ||
          (sort[sortKey] === -1
            ? new Date(b[sortKey]) - new Date(a[sortKey])
            : new Date(a[sortKey]) - new Date(b[sortKey]));
      });

      return answer;
    });

    channels = channels.slice(offset, offset + limit);
    const fChannels = await this.enrichChannels(channels);
    return fChannels;
  }

  /**
   *
   */
  enrichChannels = async (channels) => {
    const keysToRetrieve = [];
    channels.forEach((c) => {
      keysToRetrieve.push(c.members, c.messages, c.read);
      if (keysToRetrieve.indexOf(c.config) === -1)
        keysToRetrieve.push(c.config);
    });

    const state = await this.asyncStorage.multiGet(keysToRetrieve);
    const flattenedstate = {};
    state.forEach((kmPair) => {
      flattenedstate[kmPair[0]] = kmPair[1] ? JSON.parse(kmPair[1]) : [];
    });

    let usersToRetrive = [];
    const storedChannels = channels.map((c) => ({
      ...c,
      messages: flattenedstate[c.messages],
      members: flattenedstate[c.members],
      read: flattenedstate[c.read],
      config: flattenedstate[c.config],
    }));

    storedChannels.forEach((c) => {
      c.members.forEach((m) => usersToRetrive.push(m.user));
      c.messages.forEach((m) => {
        m.mentioned_users.forEach((u) => usersToRetrive.push(u));
        m.latest_reactions.forEach((r) => usersToRetrive.push(r.user));
      });
    });

    usersToRetrive = usersToRetrive.filter(
      (item, index) => usersToRetrive.indexOf(item) === index,
    );

    const users = await this.asyncStorage.multiGet(usersToRetrive);
    const flatteneUsers = {};
    users.forEach((kuPair) => {
      flatteneUsers[kuPair[0]] = JSON.parse(kuPair[1]);
    });

    const finalChannels = storedChannels.map((c) => {
      const channel = { ...c };
      channel.members = c.members.map((m) => {
        const member = m;
        member.user = flatteneUsers[member.user];
        return member;
      });

      for (const userId in channel.read) {
        channel.read[userId].user = flatteneUsers[channel.read[userId].user];
        channel.read[userId].last_read = new Date(
          channel.read[userId].last_read,
        );
      }
      channel.read = Object.values(channel.read);

      channel.messages = c.messages.map((m) => {
        const message = { ...m };
        message.user = flatteneUsers[message.user];
        message.mentioned_users = m.mentioned_users.map(
          (u) => flatteneUsers[u],
        );
        message.latest_reactions = m.latest_reactions.map((r) => {
          const reaction = r;
          reaction.user = flatteneUsers[r.user];

          return reaction;
        });

        message.own_reactions = m.own_reactions.map((r) => {
          const reaction = r;
          reaction.user = flatteneUsers[r.user];

          return reaction;
        });

        return message;
      });

      return channel;
    });

    return finalChannels;
  };

  // TODO: Implement the following
  async updateChannelData() {}

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async insertMessageForChannel(channelId, message) {
    return await this.insertMessagesForChannel(channelId, [message]);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} messages
   */
  async insertMessagesForChannel(channelId, messages) {
    const storables = {};
    const existingMessages = await this.getItem(
      getChannelMessagesKey(this.userId, channelId),
    );
    let newMessages = messages.map((m) =>
      convertMessageToStorable(m, storables, this.userId),
    );

    newMessages = existingMessages.concat(newMessages);

    storables[getChannelMessagesKey(this.userId, channelId)] = newMessages;

    await this.multiSet(storables);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} updatedMessage
   */
  async updateMessage(channelId, updatedMessage) {
    const storables = {};
    const existingMessages = await this.getItem(
      getChannelMessagesKey(this.userId, channelId),
      [],
    );

    const newMessages = existingMessages.map((m) => {
      if (m.id !== updatedMessage.id) {
        return m;
      }

      return convertMessageToStorable(updatedMessage, storables, this.userId);
    });

    storables[getChannelMessagesKey(this.userId, channelId)] = newMessages;

    await this.multiSet(storables);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async addReactionForMessage(channelId, message) {
    await this.updateMessage(channelId, message);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async deleteReactionForMessage(channelId, message) {
    await this.updateMessage(channelId, message);
  }

  async addMemberToChannel() {}
  async removeMemberFromChannel() {}
  async updateMember() {}

  /**
   *
   * @param {*} channelId
   * @param {*} user
   * @param {*} lastRead
   */
  async updateReadState(channelId, user, lastRead) {
    const reads = await this.getItem(getChannelReadKey(this.userId, channelId));
    const storables = {};

    if (reads[user.id]) {
      reads[user.id] = {
        last_read: lastRead,
        user: convertUserToStorable(user, storables, this.userId),
      };
    }

    storables[getChannelReadKey(this.userId, channelId)] = reads;
    await this.multiSet(storables);
  }

  async queryMessages() {}

  /**
   *
   * @param {*} channels
   */
  insertChannels(channels) {
    const values = [];
    channels.forEach((c) => {
      values.push([getChannelKey(this.userId, c.id), JSON.stringify(c)]);
    });

    return values;
  }

  /**
   *
   * @param {*} channelIds
   */
  async getChannels(channelIds) {
    const channelsValue = await this.asyncStorage.multiGet(channelIds);

    return channelsValue.map((ckPair) => JSON.parse(ckPair[1]));
  }

  /**
   *
   * @param {*} channelId
   */
  async getChannel(channelId) {
    const channel = await this.getItem(getChannelKey(this.userId, channelId));

    return channel;
  }

  /**
   *
   * @param {*} channelIds
   */
  async getChannelMessages(channelIds) {
    const channelMsgsToRetrieve = channelIds.map((i) =>
      getChannelMessagesKey(this.userId, i),
    );

    const channelMessagesValue = await this.asyncStorage.multiGet(
      channelMsgsToRetrieve,
    );

    const channelMessages = {};
    for (let i = 0; i < channelMessagesValue.length; i++) {
      channelMessages[channelMessagesValue[i][0]] = channelMessagesValue[i][1]
        ? JSON.parse(channelMessagesValue[i][1])
        : [];
    }

    return channelMessages;
  }

  /**
   *
   * @param {*} query
   */
  async getChannelIdsForQuery(query) {
    let channelIds = await this.getItem(getQueryKey(this.userId, query));

    // .log('channelIds', channelIds);
    if (!channelIds) return [];
    channelIds = channelIds.filter(
      (item, index) => channelIds.indexOf(item) === index,
    );

    return channelIds;
  }

  async truncateChannel(channelId) {
    const channelMessagesKey = getChannelMessagesKey(this.userId, channelId);
    const storables = {};

    // Empty all the messages in the channel.
    storables[channelMessagesKey] = [];

    // update the last_message_at of that channel.
    const channel = await this.getChannel(channelId);
    channel.last_message_at = null;
    storables[getChannelKey(this.userId, channelId)] = channel;

    await this.multiSet(storables);
  }
}
