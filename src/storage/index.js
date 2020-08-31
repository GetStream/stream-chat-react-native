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
    this.storageType = storageType;

    if (storageType === 'realm') {
      this.db = new RealmStorage(
        StorageClass,
        chatClient.userID,
        this.encryptionKey,
      );
    }

    if (storageType === 'async-storage') {
      this.db = new AsyncLocalStorage(StorageClass, chatClient.userID);
    }
    this.logger = () => {};
  }

  setLogger(logger) {
    this.logger = logger;
    this.db.setLogger(logger);
  }

  /**
   *
   * @param {*} query
   * @param {*} channels
   * @param {*} resync
   */
  async storeChannels(filters, sort, channels, resync) {
    const query = JSON.stringify({
      filters,
      sort,
    });
    const channelValues = channels.map((c) => ({
      ...c,
      config: c.getConfig(),
    }));

    try {
      await this.db.storeChannels(query, channelValues, resync);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'storeChannels failed', {
        error: e,
        tags: [`${this.storageType}`, 'storeChannels'],
      });
    }
  }

  /**
   *
   * @param {*} channelId
   * @param {*} data
   */
  async updateChannelData(channelId, data) {
    try {
      await this.db.updateChannelData(channelId, data);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'updateChannelData failed', {
        error: e,
        tags: [`${this.storageType}`, 'updateChannelData'],
      });
    }
  }

  /**
   *
   * @param {*} filters
   * @param {*} sort
   * @param {*} offset
   * @param {*} limit
   */
  async queryChannels(
    filters,
    sort = { last_message_at: -1 },
    offset = 0,
    limit = 10,
  ) {
    const query = JSON.stringify({
      filters,
      sort,
    });

    let storedChannels;
    try {
      console.r.log(query);
      storedChannels = await this.db.queryChannels(query, sort, offset, limit);
      if (!storedChannels) return [];
      const fChannels = storedChannels.map((c) => {
        this.chatClient._addChannelConfig({
          channel: {
            config: c.config,
            type: c.type,
          },
        });

        const fChannel = this.chatClient.channel(c.type, c.id, {});
        fChannel.data = c.data;
        // eslint-disable-next-line no-underscore-dangle
        fChannel._initializeState({
          members: c.members,
          messages: c.messages,
          read: c.read,
        });
        console.r.log('>> >>', fChannel);

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
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'queryChannels failed', {
        error: e,
        tags: [`${this.storageType}`, 'queryChannels'],
      });
      throw e;
    }
  }
  async insertMessageForChannel(channel_id, message) {
    if (message.parent_id && message.parent_id.length > 0) {
      return;
    }

    try {
      await this.db.insertMessageForChannel(channel_id, message);
    } catch (e) {
      this.logger(
        `${this.storageType} storage`,
        'insertMessageForChannel failed',
        {
          error: e,
          tags: [`${this.storageType}`, 'insertMessageForChannel'],
        },
      );
    }
  }
  async insertMessagesForChannel(channel_id, messages) {
    try {
      await this.db.insertMessagesForChannel(channel_id, messages);
    } catch (e) {
      this.logger(
        `${this.storageType} storage`,
        'insertMessagesForChannel failed',
        {
          error: e,
          tags: [`${this.storageType}`, 'insertMessagesForChannel'],
        },
      );
    }
  }
  async updateMessage(channelId, message) {
    if (message.parent_id && message.parent_id.length > 0) {
      return;
    }

    try {
      await this.db.updateMessage(channelId, message);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'updateMessage failed', {
        error: e,
        tags: [`${this.storageType}`, 'updateMessage'],
      });
    }
  }
  async addReactionForMessage(channelId, message) {
    if (message.parent_id && message.parent_id.length > 0) {
      return;
    }

    try {
      await this.db.addReactionForMessage(channelId, message);
    } catch (e) {
      this.logger(
        `${this.storageType} storage`,
        'addReactionForMessage failed',
        {
          error: e,
          tags: [`${this.storageType}`, 'addReactionForMessage'],
        },
      );
    }
  }
  async deleteReactionForMessage(channelId, message) {
    if (message.parent_id && message.parent_id.length > 0) {
      return;
    }

    try {
      await this.db.deleteReactionForMessage(channelId, message);
    } catch (e) {
      this.logger(
        `${this.storageType} storage`,
        'deleteReactionForMessage failed',
        {
          error: e,
          tags: [`${this.storageType}`, 'deleteReactionForMessage'],
        },
      );
    }
  }
  async addMemberToChannel(channel_id, member) {
    try {
      await this.db.addMemberToChannel(channel_id, member);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'addMemberToChannel failed', {
        error: e,
        tags: [`${this.storageType}`, 'addMemberToChannel'],
      });
    }
  }
  async removeMemberFromChannel(channel_id, userId) {
    try {
      await this.db.removeMemberFromChannel(channel_id, userId);
    } catch (e) {
      this.logger(
        `${this.storageType} storage`,
        'removeMemberFromChannel failed',
        {
          error: e,
          tags: [`${this.storageType}`, 'removeMemberFromChannel'],
        },
      );
    }
  }
  async updateMember(channel_id, member) {
    try {
      await this.db.updateMember(member);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'updateMember failed', {
        error: e,
        tags: [`${this.storageType}`, 'updateMember'],
      });
    }
  }
  async updateReadState(channelId, user, lastRead) {
    try {
      await this.db.updateReadState(channelId, user, lastRead);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'updateReadState failed', {
        error: e,
        tags: [`${this.storageType}`, 'updateReadState'],
      });
    }
  }

  async queryMessages(channelId, lastMessage, limitPerPage) {
    try {
      return await this.db.queryMessages(channelId, lastMessage, limitPerPage);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'queryMessages failed', {
        error: e,
        tags: [`${this.storageType}`, 'queryMessages'],
      });
    }
  }

  async truncateChannel(channelId) {
    try {
      await this.db.truncateChannel(channelId);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'truncateChannel failed', {
        error: e,
        tags: [`${this.storageType}`, 'truncateChannel'],
      });
    }
  }

  async deleteChannel(channelId) {
    try {
      await this.db.deleteChannel(channelId);
    } catch (e) {
      this.logger(`${this.storageType} storage`, 'deleteChannel failed', {
        error: e,
        tags: [`${this.storageType}`, 'deleteChannel'],
      });
    }
  }

  /**
   * Close any open connections to database.
   */
  close() {
    this.db.close();
  }

  /**
   * Delete all the entries in database.
   */
  async deleteAll() {
    await this.db.deleteAll();
  }
}
