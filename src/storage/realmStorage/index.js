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
  ReactionCountSchema,
} from './schemas';
import {
  getMessagesFromRealmList,
  getReadStatesFromRealmList,
  getChannelConfigFromRealm,
  convertMessageToRealm,
  convertReactionToRealm,
  convertReadStateToRealm,
  convertChannelToRealm,
} from './mappers';
import Reactotron from 'reactotron-react-native';

const SCHEMA_VERSION = 0;

export class RealmStorage {
  constructor(client, RealmClass) {
    this.chatClient = client;
    this.RealmClass = RealmClass;
    this.realm = null;
    this.initialized = false;
  }

  async getRealm() {
    const that = this;

    if (this.initialized) {
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
          ReactionCountSchema,
          ChannelConfigSchema,
          CommandSchema,
        ],
        schemaVersion: SCHEMA_VERSION,
      });
    } catch (e) {
      throw Error(e);
    }

    this.initialized = true;
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

        // eslint-disable-next-line no-underscore-dangle
        this.chatClient._addChannelConfig({
          channel: {
            type: c.type,
            config,
          },
        });

        const fChannel = this.chatClient.channel(c.type, c.id, {}, true);
        fChannel.data = { ...JSON.parse(c.data) };
        // eslint-disable-next-line no-underscore-dangle
        fChannel._initializeState({
          members: c.members,
          messages,
          read,
        });
        fChannel.isOfflineChannel = true;

        channels.push(fChannel);
      }
    }
    Reactotron.log(channels);
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
   * @param {*} messageId
   * @param {*} reaction
   * @param {*} ownReaction
   */
  async addReactionForMessage(message, reaction, ownReaction = false) {
    const messageId = message.id;
    const realm = await this.getRealm();
    realm.write(() => {
      const message = realm.objectForPrimaryKey('Message', messageId);
      const rReaction = convertReactionToRealm(reaction, realm);

      message.latest_reactions.push(rReaction);
      if (ownReaction) {
        message.own_reactions.push(rReaction);
      }

      const rReactionCount = realm.objectForPrimaryKey(
        'ReactionCount',
        `${messageId}${reaction.type}`,
      );
      if (!rReactionCount) {
        const rNewReactionCount = realm.create('ReactionCount', {
          id: `${messageId}${reaction.type}`,
          type: reaction.type,
          count: 1,
        });
        message.reaction_counts.push(rNewReactionCount);
      } else {
        rReactionCount.count = rReactionCount.count + 1;
      }
    });
  }

  /**
   *
   * @param {*} messageId
   * @param {*} reaction
   */
  async deleteReactionForMessage(message, reaction) {
    const messageId = message.id;
    const realm = await this.getRealm();
    realm.write(() => {
      const rReaction = realm.objectForPrimaryKey(
        'Reaction',
        `${reaction.user_id}${reaction.type}`,
      );

      realm.delete(rReaction);

      const rReactionCount = realm.objectForPrimaryKey(
        'ReactionCount',
        `${messageId}${reaction.type}`,
      );
      if (!rReactionCount && rReactionCount.count > 0) {
        return;
      } else {
        rReactionCount.count = rReactionCount.count - 1;
      }
    });
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
