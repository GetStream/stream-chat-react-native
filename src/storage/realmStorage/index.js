import {
  AttachmentSchema,
  ChannelConfigSchema,
  ChannelSchema,
  CommandSchema,
  MemberSchema,
  MessageSchema,
  QueryChannelsSchema,
  ReactionCountSchema,
  ReactionSchema,
  ReadSchema,
  UserSchema,
} from './schemas';
import {
  convertChannelMemberToRealm,
  convertChannelToRealm,
  convertMessageToRealm,
  convertReadStateToRealm,
  getChannelConfigFromRealm,
  getMembersFromRealmList,
  getMessagesFromRealmList,
  getReadStatesFromRealmList,
} from './mappers';
import { isValidDate } from '../../utils';

const SCHEMA_VERSION = 0;

const VALID_CHANNELS_SORT_KEYS = [
  'last_message_at',
  'updated_at',
  'created_at',
];

/**
 * Storage engine based on realmjs - https://realm.io/docs/javascript/latest/
 * Schema for the database - ./schemas.js
 */
export class RealmStorage {
  constructor(RealmClass, userId, encryptionKey) {
    this.RealmClass = RealmClass;
    this.realm = null;
    this.userId = userId;
    this.encryptionKey = encryptionKey;
    this.logger = () => {};
  }

  setLogger(logger) {
    this.logger = logger;
  }

  async getRealm() {
    const that = this;
    const realmConfig = {
      path: `stream.chat.rn.${this.userId}.realm`,
      schema: [
        MessageSchema,
        QueryChannelsSchema,
        ChannelSchema,
        MemberSchema,
        UserSchema,
        ReadSchema,
        ReactionSchema,
        AttachmentSchema,
        ReactionCountSchema,
        ChannelConfigSchema,
        CommandSchema,
      ],
      schemaVersion: SCHEMA_VERSION,
    };
    if (this.encryptionKey) {
      realmConfig.encryptionKey = this.encryptionKey;
    }

    if (this.realm && !this.realm.isClosed) {
      return new Promise((resolve) => {
        resolve(that.realm);
      });
    }

    try {
      this.realm = await this.RealmClass.open(realmConfig);
    } catch (e) {
      throw Error(e);
    }

    return this.realm;
  }

  /**
   * Deletes all the entried in database.
   */
  async deleteAll() {
    const realm = await this.getRealm();
    realm.write(() => {
      realm.deleteAll();
    });
  }

  /**
   * Close any open connections to database.
   */
  close() {
    this.realm && this.realm.close();
  }

  /**
   * Store channels in database
   *
   * @param {*} query String Stringified version of query
   * @param {*} channels Array of channel objects
   * @param {*} resync
   */
  async storeChannels(query, channels, resync) {
    const realm = await this.getRealm();
    realm.write(() => {
      const rQueryChannels = realm.objectForPrimaryKey('QueryChannels', query);
      const offlineChannels = channels.map((c) =>
        convertChannelToRealm(c, realm),
      );

      if (!rQueryChannels || resync) {
        realm.create(
          'QueryChannels',
          {
            channels: offlineChannels,
            query,
          },
          true,
        );
      } else {
        offlineChannels.forEach((oc) => rQueryChannels.channels.push(oc));
      }
      return;
    });
  }

  /**
   *
   * @param {*} channelId
   * @param {*} data
   */
  async updateChannelData(channelId, data) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channelId);
      channel.data = JSON.stringify(data);
      if (isValidDate(data.updated_at)) {
        channel.updated_at = data.updated_at;
      }

      if (isValidDate(data.created_at)) {
        channel.deleted_at = data.deleted_at;
      }

      if (isValidDate(data.last_message_at)) {
        channel.last_message_at = data.last_message_at;
      }
    });
  }

  /**
   *
   * @param {*} query
   * @param {*} offset
   * @param {*} limit
   */
  async queryChannels(query, sort, offset = 0, limit = 10) {
    const channels = [];
    const realm = await this.getRealm();
    const qc = realm.objectForPrimaryKey('QueryChannels', query);

    if (!qc) {
      return [];
    }

    const sortArray = [];
    for (const key in sort) {
      if (VALID_CHANNELS_SORT_KEYS.indexOf(key) === -1) {
        continue;
      }

      sortArray.push([key, sort[key] === -1]);
    }
    const slicedChannels = qc.channels
      .sorted(sortArray)
      .slice(offset, offset + limit);

    for (const c of slicedChannels) {
      const sortedMessages = c.messages
        .sorted('created_at', true)
        .slice(0, 100);
      const messages = getMessagesFromRealmList(sortedMessages);
      const members = getMembersFromRealmList(c.members);
      const read = getReadStatesFromRealmList(c.read);
      const config = getChannelConfigFromRealm(c.config);

      channels.push({
        cid: c.cid,
        config,
        created_at: c.created_at,
        data: JSON.parse(c.data),
        id: c.id,
        initialized: c.initialized,
        members,
        messages,
        read,
        type: c.type,
        updated_at: c.updated_at,
      });
    }
    return channels;
  }

  /**
   *
   * @param {*} channel_id
   * @param {*} message
   */
  async insertMessageForChannel(channel_id, message) {
    return await this.insertMessagesForChannel(channel_id, [message]);
  }

  /**
   *
   * @param {*} channel_id
   * @param {*} messages
   */
  async insertMessagesForChannel(channel_id, messages) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channel_id);
      messages.forEach((m) => {
        const message = convertMessageToRealm(m, realm, true);
        channel.messages.push(message);
        if (new Date(channel.last_message_at) < new Date(message.created_at)) {
          channel.last_message_at = message.created_at;
        }
      });
    });
  }

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async updateMessage(channelId, message) {
    const realm = await this.getRealm();
    realm.write(() => {
      convertMessageToRealm(message, realm, true);
    });
  }

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async addReactionForMessage(channelId, message) {
    return await this.updateMessage(channelId, message);
  }

  /**
   *
   * @param {*} channelId
   * @param {*} message
   */
  async deleteReactionForMessage(channelId, message) {
    return await this.updateMessage(channelId, message);
  }

  /**
   *
   * @param {*} channel_id
   * @param {*} member
   */
  async addMemberToChannel(channel_id, member) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channel_id);
      const rMember = convertChannelMemberToRealm(
        channel_id,
        member,
        realm,
        true,
      );

      channel.members.push(rMember);
    });
  }

  /**
   *
   * @param {*} channel_id
   * @param {*} userId
   */
  async removeMemberFromChannel(channel_id, userId) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channel_id);
      const memberIndex = channel.members.findIndex(
        (m) => m.user_id === userId,
      );

      channel.members.splice(memberIndex, 1);
    });
  }

  /**
   *
   * @param {*} member
   */
  // TODO: Test this scenario
  async updateMember(channelId, member) {
    const realm = await this.getRealm();
    realm.write(() => {
      const rUser = realm.create('User', member.user, true);
      realm.create('Member', { ...member, user: rUser }, true);
    });
  }

  /**
   *
   * @param {*} channelId
   * @param {*} user
   * @param {*} lastRead
   */
  async updateReadState(channelId, user, lastRead) {
    const realm = await this.getRealm();
    realm.write(() => {
      const read = realm.objectForPrimaryKey('Read', `${channelId}${user.id}`);
      if (read) {
        read.lastRead = lastRead;
        read.user = realm.create('User', user, true);
        return;
      }

      const channel = realm.objectForPrimaryKey('Channel', channelId);
      channel.read.push(
        convertReadStateToRealm(channelId, {
          last_read: lastRead,
          realm,
          user,
        }),
      );
    });
  }

  /**
   *
   * @param {*} channelId
   * @param {*} lastMessage
   * @param {*} limitPerPage
   */
  async queryMessages(channelId, lastMessage, limitPerPage) {
    const realm = await this.getRealm();
    const channel = realm.objectForPrimaryKey('Channel', `${channelId}`);
    const channelMessages = channel.messages
      .filtered('created_at < $0', new Date(lastMessage.created_at))
      .sorted('created_at', true)
      .slice(0, limitPerPage);
    const messages = getMessagesFromRealmList(channelMessages);
    return { messages };
  }

  /**
   *
   * @param {*} channelId
   */
  async truncateChannel(channelId) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channelId);
      realm.delete(channel.messages);
      channel.last_message_at = null;
    });
  }

  /**
   *
   * @param {*} channelId
   */
  async deleteChannel(channelId) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channelId);
      realm.delete(channel.messages);
      realm.delete(channel.members);
      realm.delete(channel.read);
      realm.delete(channel);
    });
  }
}
