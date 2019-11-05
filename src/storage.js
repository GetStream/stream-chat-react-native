import { ChannelState } from 'stream-chat';
import { AsyncStorage } from './native';

export class Storage {
  constructor() {
    // this.setItem = setItem;
    // this.getItem = getItem;
    // this.multiSet = multiSet;
    // this.multiGet = multiGet;
    this.dbinterface = AsyncStorageDBInterface;
  }

  // async storeItem(key, item) {
  //   const itemStr = JSON.stringify(item);
  //   const chatKey = `getstream:chat@${key}`;

  //   await this.setItem(chatKey, itemStr);
  // }

  // async storeMultipuleItems(values) {
  //   // if (keys.length !== values.length) {
  //   //   return;
  //   // }

  //   // if (!this.multiSet) {
  //   //   for (let i = 0; i < keys.length; i++) {
  //   //     await this.setItem(keys[i], values[i]);
  //   //   }
  //   // }

  //   // const chatKeys = keys.map((k) => `getstream:chat@${k}`);
  //   // console.log(chatKeys);
  //   await this.multiSet(values);
  // }

  // async retrieveItem(key) {
  //   const chatKey = `getstream:chat@${key}`;
  //   const value = await this.getItem(chatKey);

  //   return JSON.parse(value);
  // }

  async storeChannels(query, channels) {
    const channelIds = channels.map((c) => c.id);
    // const keys = [];
    // const values = [];
    console.log(query);
    // keys.push('query');
    // values.push([`getstream:chat@${query}`, JSON.stringify(channelIds)]);

    // TODO: Combine following two calls
    const offlineChannels = channels.map((c) => this.getOfflineChannel(c));
    await this.dbinterface.insertMessagesAndMembersForChannels(channels);
    await this.dbinterface.insertQueryChannels(query, channelIds);
    await this.dbinterface.insertChannels(offlineChannels);

    // channels.forEach((c) => {
    //   // keys.push(`channel:${c.id}`);
    //   values.push([
    //     `getstream:chat@channel:${c.id}`,
    //     JSON.stringify(this.getOfflineChannel(c)),
    //   ]);
    //   // keys.push(`channel:${c.id}:messages`);
    //   values.push([
    //     `getstream:chat@channel:${c.id}:messages`,
    //     JSON.stringify(c.state.messages),
    //   ]);

    //   for (const user_id in c.state.members) {
    //     values.push([
    //       `getstream:chat@user:${user_id}`,
    //       JSON.stringify(c.state.members[user_id]),
    //     ]);
    //   }
    // });

    // await this.storeMultipuleItems(values);
  }

  getOfflineChannel(channel) {
    const countUnread = channel.countUnread();
    const config = channel.getConfig();
    // const stateMessages = channel.state.messages
    //   ? [...channel.state.messages]
    //   : [];
    const stateMembers = channel.state.members
      ? { ...channel.state.members }
      : {};
    return {
      type: channel.type,
      id: channel.id,
      data: channel.data,
      cid: channel.cid,
      state: {
        // messages: stateMessages,
        members: Object.keys(stateMembers),
      },
      initialized: channel.initialized,
      countUnread,
      config,
    };
  }

  async queryChannels(query) {
    const channelIds = await this.dbinterface.getChannelIdsForQuery(query);

    if (!channelIds) return [];
    // console.log(channelIds);

    let channels = await this.dbinterface.getChannels(channelIds);
    const channelMessagesMap = await this.dbinterface.getChannelMessages(
      channelIds,
    );

    // const channelsValue = await this.multiGet(channelIdsToRetrieve);
    // const channelMessagesValue = await this.multiGet(channelMsgsToRetrieve);
    // console.log('lol');
    // console.log(channelsValue);
    // console.log(
    //   channelsValue.map((ckPair) => {
    //     console.log(ckPair[1]);
    //     return JSON.parse(ckPair[1]);
    //   }),
    // );
    // const messagesValue = this.multiGet(channelMsgsToRetrieve);

    // const channelMessages = {};
    // for (let i = 0; i < channelMessagesValue.length; i++) {
    //   channelMessages[channelMessagesValue[i][0]] = JSON.parse(
    //     channelMessagesValue[i][1],
    //   );
    // }

    const membersToRetrieve = [];
    channels = channels.map((c) => {
      const channel = JSON.parse(c);
      const cState = { ...channel.state };

      channel.state = new ChannelState(channel);
      channel.state.messages =
        channelMessagesMap[`getstream:chat@channel:${channel.id}:messages`];
      cState.members.forEach((mid) => {
        if (membersToRetrieve.indexOf(mid) === -1) {
          membersToRetrieve.push(mid);
        }
      });
      channel.state.members = cState.members;
      channel.countUnread = () => c.countUnread;
      channel.on = () => {};
      channel.off = () => {};
      channel.watch = () => {};
      channel.query = () => {};
      channel.getConfig = () => c.config;
      channel.keystroke = () =>
        new Promise((resolve) => {
          resolve();
        });

      return channel;
    });

    const members = await this.dbinterface.getMembers(membersToRetrieve);
    console.log(members);
    // {id: member}

    channels.forEach((c) => {
      const channelStateMembers = {};
      c.state.members.forEach((mid) => {
        channelStateMembers[mid] = { ...members[mid] };
      });

      c.state.members = { ...channelStateMembers };
    });
    // console.log(channels);
    return channels;
  }

  async insertMessagesForChannel(channel_id, messages) {
    await this.dbinterface.insertMessagesForChannel(channel_id, messages);
  }
}

class AsyncStorageDBInterface {
  static async insertQueryChannels(query, channels) {
    await AsyncStorage.setItem(
      `getstream:chat@${query}`,
      JSON.stringify(channels),
    );
  }

  static async insertChannels(channels) {
    const values = [];
    channels.forEach((c) => {
      // keys.push(`channel:${c.id}`);
      values.push([`getstream:chat@channel:${c.id}`, JSON.stringify(c)]);
    });

    await AsyncStorage.multiSet(values);
  }

  static async insertMessagesAndMembersForChannels(channels) {
    const values = [];
    channels.forEach((c) => {
      // keys.push(`channel:${c.id}:messages`);
      values.push([
        `getstream:chat@channel:${c.id}:messages`,
        JSON.stringify(c.state.messages),
      ]);

      for (const user_id in c.state.members) {
        values.push([
          `getstream:chat@user:${user_id}`,
          JSON.stringify(c.state.members[user_id]),
        ]);
      }
    });

    await AsyncStorage.multiSet(values);
  }

  static async insertMessagesForChannel(channel_id, messages) {
    const cKey = `getstream:chat@channel:${channel_id}:messages`;
    const messagesValue = await AsyncStorage.getItem(cKey);
    const existingMessages = JSON.parse(messagesValue);

    const newMessages = messages.concat(existingMessages);
    console.log(newMessages.map((m) => m.text));

    await AsyncStorage.setItem(cKey, JSON.stringify(newMessages));
  }

  static async getChannels(channelIds) {
    const channelIdsToRetrieve = channelIds.map(
      (i) => `getstream:chat@channel:${i}`,
    );
    const channelsValue = await AsyncStorage.multiGet(channelIdsToRetrieve);

    return channelsValue.map((ckPair) => ckPair[1]);
  }

  static async getChannelMessages(channelIds) {
    const channelMsgsToRetrieve = channelIds.map(
      (i) => `getstream:chat@channel:${i}:messages`,
    );

    const channelMessagesValue = await AsyncStorage.multiGet(
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

  static async getChannelIdsForQuery(query) {
    const channelIdsValue = await AsyncStorage.getItem(
      `getstream:chat@${query}`,
    );

    return JSON.parse(channelIdsValue);
  }

  static async getMembers(memberIds) {
    const keys = memberIds.map((mid) => `getstream:chat@user:${mid}`);
    const membersValue = await AsyncStorage.multiGet(keys);
    const flatteneMembers = {};
    membersValue.forEach((kmPair) => {
      const member = JSON.parse(kmPair[1]);
      flatteneMembers[member.user.id] = member;
    });

    return flatteneMembers;
  }
}
