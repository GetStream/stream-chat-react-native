import {
  QueryChannelsSchema,
  ChannelSchema,
  MemberSchema,
  UserSchema,
  MessageSchema,
  ReadSchema,
  ReactionSchema,
  ChannelConfigSchema,
  CommandSchema,
  AttachmentSchema,
  ReactionCountSchema,
} from './schemas';
import {
  getMessagesFromRealmList,
  getReadStatesFromRealmList,
  getChannelConfigFromRealm,
  convertMessageToRealm,
  convertReadStateToRealm,
  convertChannelToRealm,
} from './mappers';

const SCHEMA_VERSION = 0;

export class RealmStorage {
  constructor(RealmClass) {
    this.RealmClass = RealmClass;
    this.realm = null;
  }

  async getRealm() {
    const that = this;

    if (this.realm && !this.realm.isClosed) {
      return new Promise((resolve) => {
        resolve(that.realm);
      });
    }

    try {
      this.realm = await this.RealmClass.open({
        path: 'stream.chat.rn',
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
      });
    } catch (e) {
      throw Error(e);
    }

    return this.realm;
  }

  clear() {
    this.realm && this.realm.close();
  }

  /**
   * Store channels in database
   * @param {*} query
   * @param {*} channels
   * @param {*} resync
   */
  async storeChannels(query, channels, resync) {
    const realm = await this.getRealm();

    realm.write(() => {
      if (resync) {
        realm.deleteAll();
      }

      const rQueryChannels = realm.objectForPrimaryKey('QueryChannels', query);
      const offlineChannels = channels.map((c) =>
        convertChannelToRealm(c, realm),
      );

      if (!rQueryChannels || resync) {
        realm.create(
          'QueryChannels',
          {
            query,
            channels: offlineChannels,
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
    });
  }

  /**
   *
   * @param {*} query
   * @param {*} offset
   * @param {*} limit
   */
  async queryChannels(query, offset = 0, limit = 10) {
    const channels = [];
    const realm = await this.getRealm();
    const rQueryChannels = realm
      .objects('QueryChannels')
      .filtered('query == $0', query);

    for (const qc of rQueryChannels) {
      for (const c of qc.channels.slice(offset, offset + limit)) {
        const sortedMessages = c.messages.sorted('created_at');
        const messages = getMessagesFromRealmList(sortedMessages);
        const read = getReadStatesFromRealmList(c.read);
        const config = getChannelConfigFromRealm(c.config);

        channels.push({
          ...c,
          data: JSON.parse(c.data),
          messages,
          read,
          config,
        });
      }
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
        const message = convertMessageToRealm(m, realm);
        channel.messages.push(message);
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
      convertMessageToRealm(message, realm);
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
      const rUser = realm.create('User', member.user, true);
      const rMember = realm.create('Member', { ...member, user: rUser }, true);

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
  async updateMember(member) {
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
          user,
          realm,
        }),
      );
    });
  }

  async queryMessages() {}
}
