/**
 * =======================================================================================
 * ==================== STILL IN PROGRESS ================================================
 * =======================================================================================
 */

import { ChannelState } from 'stream-chat';
import { AsyncStorage } from '../native';

/**
 * Local storage interface based on AsyncStorage
 */
export class AsyncLocalStorage {
  constructor() {}

  async storeChannels(query, channels) {
    const channelIds = channels.map((c) => c.id);
    // TODO: Combine following two calls
    const offlineChannels = channels.map((c) =>
      this._convertChannelToStorable(c),
    );
    await this.insertMessagesAndMembersForChannels(channels);
    await this.insertQueryChannels(query, channelIds);
    await this.insertChannels(offlineChannels);
  }

  _convertChannelToStorable(channel) {
    const config = channel.getConfig();
    const stateMembers = channel.state.members
      ? { ...channel.state.members }
      : {};
    return {
      type: channel.type,
      id: channel.id,
      data: channel.data,
      cid: channel.cid,
      members: Object.keys(stateMembers),
      initialized: channel.initialized,
      config,
    };
  }

  async queryChannels(query) {
    const channelIds = await this.getChannelIdsForQuery(query);

    if (!channelIds) return [];

    let channels = await this.getChannels(channelIds);
    const channelMessagesMap = await this.getChannelMessages(channelIds);

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

    const members = await this.getMembers(membersToRetrieve);
    console.log(members);
    // {id: member}

    channels.forEach((c) => {
      const channelStateMembers = {};
      c.state.members.forEach((mid) => {
        channelStateMembers[mid] = { ...members[mid] };
      });

      c.state.members = { ...channelStateMembers };
    });

    return channels;
  }

  // TODO: Implement the following
  async updateChannelData() {}
  async insertMessageForChannel() {}
  async updateMessage() {}
  async addReactionForMessage() {}
  async deleteReactionForMessage() {}
  async addMemberToChannel() {}
  async removeMemberFromChannel() {}
  async updateMember() {}
  async updateReadState() {}
  async queryMessages() {}

  async insertQueryChannels(query, channels) {
    await AsyncStorage.setItem(
      `getstream:chat@${query}`,
      JSON.stringify(channels),
    );
  }

  async insertChannels(channels) {
    const values = [];
    channels.forEach((c) => {
      values.push([`getstream:chat@channel:${c.id}`, JSON.stringify(c)]);
    });

    await AsyncStorage.multiSet(values);
  }

  async insertMessagesAndMembersForChannels(channels) {
    const values = [];
    channels.forEach((c) => {
      // keys.push(`channel:${c.id}:messages`);
      values.push([
        `getstream:chat@channel:${c.id}:messages`,
        JSON.stringify(c.state.messages),
      ]);

      for (const user_id in c.state.members) {
        values.push([
          `getstream:chat@member:${user_id}`,
          JSON.stringify(c.state.members[user_id]),
        ]);
      }
    });

    await AsyncStorage.multiSet(values);
  }

  async insertMessagesForChannel(channel_id, messages) {
    const cKey = `getstream:chat@channel:${channel_id}:messages`;
    const messagesValue = await AsyncStorage.getItem(cKey);
    const existingMessages = JSON.parse(messagesValue);

    const newMessages = messages.concat(existingMessages);
    console.log(newMessages.map((m) => m.text));

    await AsyncStorage.setItem(cKey, JSON.stringify(newMessages));
  }

  async getChannels(channelIds) {
    const channelIdsToRetrieve = channelIds.map(
      (i) => `getstream:chat@channel:${i}`,
    );
    const channelsValue = await AsyncStorage.multiGet(channelIdsToRetrieve);

    return channelsValue.map((ckPair) => ckPair[1]);
  }

  async getChannelMessages(channelIds) {
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

  async getChannelIdsForQuery(query) {
    const channelIdsValue = await AsyncStorage.getItem(
      `getstream:chat@${query}`,
    );

    return JSON.parse(channelIdsValue);
  }

  async getMembers(memberIds) {
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
