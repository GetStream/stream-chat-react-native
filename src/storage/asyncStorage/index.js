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
/**
 * Local storage interface based on AsyncStorage
 */
export class AsyncLocalStorage {
  constructor(AsyncStorage) {
    this.asyncStorage = AsyncStorage;
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
    const channelIds = channels.map((c) => getChannelKey(c.id));

    const storables = {};
    channels.forEach(async (c) => await convertChannelToStorable(c, storables));

    if (resync) {
      storables[getQueryKey(query)] = channelIds;
    } else {
      const existingChannelIds = await this.getItem(getQueryKey(query), []);

      storables[getQueryKey(query)] = existingChannelIds.concat(channelIds);
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
   * @param {*} storables
   */
  async multiSet(storables) {
    const storablesArray = [];

    for (const key in storables) {
      storablesArray.push([key, JSON.stringify(storables[key])]);
    }

    return await this.asyncStorage.multiSet(storablesArray);
  }

  clear() {}

  /**
   *
   * @param {*} query
   */
  async queryChannels(query, sort, offset, limit) {
    let channelIds = await this.getChannelIdsForQuery(query);
    if (!channelIds) return [];

    channelIds = channelIds.slice(offset, offset + limit);
    const channels = await this.getChannels(channelIds);
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

    const messagesAndMembers = await this.asyncStorage.multiGet(keysToRetrieve);
    const flattenedMessagesAndMembers = {};
    messagesAndMembers.forEach((kmPair) => {
      flattenedMessagesAndMembers[kmPair[0]] = JSON.parse(kmPair[1]);
    });
    let usersToRetrive = [];
    const storedChannels = channels.map((c) => ({
      ...c,
      messages: flattenedMessagesAndMembers[c.messages],
      members: flattenedMessagesAndMembers[c.members],
      read: flattenedMessagesAndMembers[c.read],
      config: flattenedMessagesAndMembers[c.config],
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
      getChannelMessagesKey(channelId),
    );
    let newMessages = messages.map((m) =>
      convertMessageToStorable(m, storables),
    );

    newMessages = existingMessages.concat(newMessages);

    storables[getChannelMessagesKey(channelId)] = newMessages;

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
      getChannelMessagesKey(channelId),
      [],
    );

    const newMessages = existingMessages.map((m) => {
      if (m.id !== updatedMessage.id) {
        return m;
      }

      return convertMessageToStorable(updatedMessage, storables);
    });

    storables[getChannelMessagesKey(channelId)] = newMessages;

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
    const reads = await this.getItem(getChannelReadKey(channelId));
    const storables = {};

    if (reads[user.id]) {
      reads[user.id] = {
        last_read: lastRead,
        user: convertUserToStorable(user, storables),
      };
    }

    storables[getChannelReadKey(channelId)] = reads;
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
      values.push([getChannelKey(c.id), JSON.stringify(c)]);
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
   * @param {*} channelIds
   */
  async getChannelMessages(channelIds) {
    const channelMsgsToRetrieve = channelIds.map((i) =>
      getChannelMessagesKey(i),
    );

    const channelMessagesValue = await this.asyncStorage.multiGet(
      channelMsgsToRetrieve,
    );

    const channelMessages = {};
    for (let i = 0; i < channelMessagesValue.length; i++) {
      channelMessages[channelMessagesValue[i][0]] = JSON.parse(
        channelMessagesValue[i][1],
      );
    }

    return channelMessages;
  }

  /**
   *
   * @param {*} query
   */
  async getChannelIdsForQuery(query) {
    let channelIds = await this.getItem(getQueryKey(query));

    // .log('channelIds', channelIds);
    if (!channelIds) return [];
    channelIds = channelIds.filter(
      (item, index) => channelIds.indexOf(item) === index,
    );

    return channelIds;
  }
}
