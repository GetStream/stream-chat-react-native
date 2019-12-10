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
  constructor(chatClient, StorageClass, storageType, encryptionKey) {
    this.chatClient = chatClient;
    this.StorageClass = StorageClass;
    this.encryptionKey = encryptionKey;

    if (storageType === 'realm') {
      this.storage = new RealmStorage(
        StorageClass,
        chatClient.userID,
        this.encryptionKey,
      );
    }

    if (storageType === 'async-storage') {
      this.storage = new AsyncLocalStorage(StorageClass, chatClient.userID);
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
   * @param {*} sort
   * @param {*} offset
   * @param {*} limit
   */
  async queryChannels(
    query,
    sort = { last_message_at: -1 },
    offset = 0,
    limit = 10,
  ) {
    const storedChannels = await this.storage.queryChannels(
      query,
      sort,
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

      const fChannel = this.chatClient.channel(c.type, c.id, {}, true);
      fChannel.data = c.data;
      // eslint-disable-next-line no-underscore-dangle
      fChannel._initializeState({
        members: c.members,
        messages: c.messages,
        read: c.read,
      });

      // TODO: Currently I am maintainign two variables on channel
      //
      // - initialized : where state is initialized from remote server
      // - passive : offline channel
      //
      // This is to keep original behaviour intact, in case if someone does not want offline behaviour.
      // Although I am sure we can find a way to achieve it using one single variable instead of two.
      fChannel.initialized = true;

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

  async truncateChannel(channelId) {
    return await this.storage.truncateChannel(channelId);
  }
  /**
   * Close any open connections to database.
   */
  close() {
    this.storage.close();
  }

  /**
   * Delete all the entries in database.
   */
  async deleteAll() {
    await this.storage.deleteAll();
  }
}
