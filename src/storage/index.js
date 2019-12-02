/* eslint-disable no-underscore-dangle */
import { RealmStorage } from './realmStorage';
import { AsyncLocalStorage } from './asyncStorage';

/**
 * LocalStorage acts as bridge between storage class and data coming from our js client.
 * Our js client provides us instance of `Channel` class via queryChannels function. LocalStorage
 * class converts that class to plain json object that can be consued by local storage class for saving
 *
 * And vice versa, when we retrive data from offline storage, following LocalStorage class converts it
 * back to `Channel` instance, which can then be consumed by components.
 */
export class LocalStorage {
  constructor(chatClient, StorageClass, storageType) {
    this.chatClient = chatClient;
    this.StorageClass = StorageClass;

    if (storageType === 'realm') {
      this.storage = new RealmStorage(StorageClass, chatClient.userID);
    }

    if (storageType === 'async-storage') {
      this.storage = new AsyncLocalStorage(StorageClass);
    }
    this.logger = () => {};
  }

  setLogger(logger) {
    this.logger = logger;
    this.storage.setLogger(logger);
  }
  /**
   *
   * @param {*} query
   * @param {*} channels
   * @param {*} resync
   */
  async storeChannels(query, channels, resync) {
    const channelValues = channels.map((c) => ({
      ...c,
      config: c.getConfig(),
    }));

    await this.storage.storeChannels(query, channelValues, resync);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} data
   */
  async updateChannelData(channelId, data) {
    return await this.storage.updateChannelData(channelId, data);
  }

  /**
   *
   * @param {*} query
   * @param {*} offset
   * @param {*} limit
   */
  async queryChannels(query, offset = 0, limit = 10, passive = true) {
    const storedChannels = await this.storage.queryChannels(
      query,
      offset,
      limit,
    );

    const fChannels = storedChannels.map((c) => {
      this.chatClient._addChannelConfig({
        channel: {
          type: c.type,
          config: c.config,
        },
      });

      const fChannel = this.chatClient.channel(c.type, c.id, {}, passive);
      fChannel.data = c.data;
      // eslint-disable-next-line no-underscore-dangle
      fChannel._initializeState({
        members: c.members,
        messages: c.messages,
        read: c.read,
      });

      fChannel.initialized = !passive;
      return fChannel;
    });
    return fChannels;
  }
  async insertMessageForChannel(channel_id, message) {
    return await this.storage.insertMessageForChannel(channel_id, message);
  }
  async insertMessagesForChannel(channel_id, messages) {
    return await this.storage.insertMessagesForChannel(channel_id, messages);
  }
  async updateMessage(channelId, message) {
    return await this.storage.updateMessage(channelId, message);
  }
  async addReactionForMessage(channelId, message) {
    return await this.storage.addReactionForMessage(channelId, message);
  }
  async deleteReactionForMessage(channelId, message) {
    return await this.storage.deleteReactionForMessage(channelId, message);
  }
  async addMemberToChannel(channel_id, member) {
    return await this.storage.addMemberToChannel(channel_id, member);
  }
  async removeMemberFromChannel(channel_id, userId) {
    return await this.storage.removeMemberFromChannel(channel_id, userId);
  }
  async updateMember(member) {
    return await this.storage.updateMember(member);
  }
  async updateReadState(channelId, user, lastRead) {
    return await this.storage.updateReadState(channelId, user, lastRead);
  }

  async queryMessages(channelId, lastMessage, limitPerPage) {
    return await this.storage.queryMessages(
      channelId,
      lastMessage,
      limitPerPage,
    );
  }

  clear() {
    this.storage.clear();
  }
}
