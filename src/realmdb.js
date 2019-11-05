import { ChannelState } from 'stream-chat';
// import { AsyncStorage } from './native';
import {
  QueryChannelsSchema,
  ChannelSchema,
  MemberSchema,
  UserSchema,
  MessageSchema,
  ReactionSchema,
  ReactionCountSchema,
} from './schemas';
const Realm = require('realm');
const SCHEMA_VERSION = 7;
export class RealmDB {
  constructor() {
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

    this.realm = await Realm.open({
      schema: [
        MessageSchema,
        QueryChannelsSchema,
        ChannelSchema,
        MemberSchema,
        UserSchema,
        ReactionSchema,
        ReactionCountSchema,
      ],
      schemaVersion: SCHEMA_VERSION,
    });

    this.initialized = true;
    return this.realm;
  }

  async storeChannels(query, channels) {
    const realm = await this.getRealm();

    realm.write(() => {
      const offlineChannels = channels.map((c) => this.getOfflineChannel(c));
      realm.create(
        'QueryChannels',
        {
          query,
          channels: offlineChannels,
        },
        true,
      );
    });
  }

  async queryChannels(query) {
    // const that = this;
    const channels = [];
    const realm = await this.getRealm();
    const rQueryChannels = realm
      .objects('QueryChannels')
      .filtered('query == $0', query);
    // const queryChannels = JSON.parse(
    //   JSON.stringify(rQueryChannels, (key, value) => {
    //     const keysToIgnore = [
    //       'channel',
    //       'messages',
    //       'mentioned_users',
    //       'latest_reactions',
    //       'own_reactions',
    //     ];
    //     if (keysToIgnore.indexOf(key) > -1) return undefined;

    //     return value;
    //   }),
    //   (key, value) => {
    //     const keysToConvert = [
    //       'channels',
    //       'members',
    //       'messages',
    //       'attachments',
    //       'mentioned_users',
    //       'latest_reactions',
    //       'own_reactions',
    //     ];
    //     if (keysToConvert.indexOf(key) > -1) {
    //       return Object.values(value);
    //     }

    //     return value;
    //   },
    // );

    rQueryChannels[0].channels.forEach((c) => {
      const channel = {
        ...c,
        countUnread: () => c.countUnread,
        on: () => {},
        off: () => {},
        watch: () => {},
        // eslint-disable-next-line object-shorthand
        query: async function() {
          // const realm = await that.getRealm();
          // const channel = realm.objectForPrimaryKey('Channel', this.id);
          // const rMessages = channel.messages;
          // for (const m of rMessages) {
          //   const message = {
          //     ...m,
          //     attachments: [],
          //     user: {},
          //   };
          //   const mentionedUsers = [];
          //   for (const mu of m.mentioned_users) {
          //     mentionedUsers.push(mu);
          //   }
          //   message.latest_reactions = message.latest_reactions.map((lr) => {
          //     const reaction = { ...lr };
          //     reaction.message_id = message.id;
          //     return reaction;
          //   });
          //   message.own_reactions = message.own_reactions.map((lr) => {
          //     const reaction = { ...lr };
          //     reaction.message_id = message.id;
          //     return reaction;
          //   });
          //   const reactionCounts = {};
          //   message.reaction_counts.forEach((rc) => {
          //     reactionCounts[rc.type] = rc.count;
          //   });
          //   message.reaction_counts = { ...reactionCounts };
          //   message.mentioned_users = mentionedUsers;
          //   this.state.messages.push(message);
          // }
        },
        markRead: () =>
          new Promise((resolve) => {
            resolve();
          }),
        getConfig: () => {},
        keystroke: () =>
          new Promise((resolve) => {
            resolve();
          }),
      };
      // channel.data = JSON.parse(channel.data);
      channel.state = new ChannelState(channel);
      channel.isOfflineChannel = true;
      channel.data = JSON.parse(channel.data);

      channel.state.messages = [];
      channel.state.members = {};
      const sortedMessages = c.messages.sorted('created_at');
      for (const m of sortedMessages) {
        const message = {
          ...m,
          attachments: [],
          user: {},
        };
        const mentionedUsers = [];
        for (const mu of m.mentioned_users) {
          mentionedUsers.push(mu);
        }
        message.latest_reactions = message.latest_reactions.map((lr) => {
          const reaction = { ...lr };
          reaction.message_id = message.id;
          return reaction;
        });
        message.own_reactions = message.own_reactions.map((lr) => {
          const reaction = { ...lr };
          reaction.message_id = message.id;
          return reaction;
        });
        const reactionCounts = {};
        message.reaction_counts.forEach((rc) => {
          reactionCounts[rc.type] = rc.count;
        });
        message.reaction_counts = { ...reactionCounts };
        message.mentioned_users = mentionedUsers;
        channel.state.messages.push(message);
      }
      for (const m of c.members) {
        channel.state.members[m.user_id] = { ...m };
      }
      delete channel.members;
      delete channel.messages;
      channels.push(channel);
    });

    // for (const qc of queryChannels) {
    //   for (const c of qc.channels) {
    //     const channel = {
    //       ...c,
    //       countUnread: () => c.countUnread,
    //       on: () => {},
    //       off: () => {},
    //       watch: () => {},
    //       query: () => {},
    //       markRead: () =>
    //         new Promise((resolve) => {
    //           resolve();
    //         }),
    //       getConfig: () => JSON.parse(c.config),
    //       keystroke: () =>
    //         new Promise((resolve) => {
    //           resolve();
    //         }),
    //     };
    //     channel.data = JSON.parse(channel.data);
    //     channel.state = new ChannelState(channel);
    //     channel.state.messages = [];
    //     channel.state.members = {};
    //     const sortedMessages = c.messages.sorted('created_at').slice(0, 2);
    //     for (let m of sortedMessages) {
    //       const message = {
    //         ...m,
    //         attachments: [],
    //         user: {},
    //       };

    //       const mentionedUsers = [];
    //       // for (const mu of m.mentioned_users) {
    //       //   mentionedUsers.push(mu);
    //       // }

    //       // message.latest_reactions = message.latest_reactions.map((lr) => {
    //       //   const reaction = { ...lr };
    //       //   reaction.message_id = message.id;

    //       //   return reaction;
    //       // });

    //       // message.own_reactions = message.own_reactions.map((lr) => {
    //       //   const reaction = { ...lr };
    //       //   reaction.message_id = message.id;

    //       //   return reaction;
    //       // });

    //       // const reactionCounts = {};

    //       // message.reaction_counts.forEach((rc) => {
    //       //   reactionCounts[rc.type] = rc.count;
    //       // });
    //       // message.reaction_counts = { ...reactionCounts };
    //       // message.mentioned_users = mentionedUsers;
    //       // channel.state.messages.push(message);
    //     }
    //     // for (const m of c.members) {
    //     //   channel.state.members[m.user_id] = { ...m };
    //     // }
    //     // delete channel.members;
    //     // delete channel.messages;
    //     // channels.push(channel);
    //   }
    // }
    // realm.close();
    return channels;
  }

  getOfflineChannel(channel) {
    const countUnread = channel.countUnread();
    const config = JSON.stringify(channel.getConfig());
    let stateMessages = channel.state.messages
      ? [...channel.state.messages]
      : [];
    let stateMembers = channel.state.members
      ? Object.values(channel.state.members)
      : [];

    stateMessages = stateMessages.map((m) => this.getOfflineMessage(m));
    stateMembers = stateMembers.map((m) => {
      const member = { user_id: m.user.id, ...m };
      return member;
    });
    return {
      type: channel.type,
      id: channel.id,
      data: JSON.stringify(channel.data),
      cid: channel.cid,
      members: [...stateMembers],
      messages: [...stateMessages],
      latestMessage: stateMessages[stateMessages.length - 1],
      initialized: channel.initialized,
      countUnread,
      config,
    };
  }

  getOfflineMessage(m) {
    const message = { ...m };
    message.latest_reactions = message.latest_reactions.map((lr) => {
      const latestReaction = { ...lr };
      latestReaction.id = lr.user_id + lr.type;
      delete latestReaction.message_id;

      return latestReaction;
    });
    message.own_reactions = message.own_reactions.map((or) => {
      const ownReaction = { ...or };
      ownReaction.id = ownReaction.user_id + ownReaction.type;
      delete ownReaction.message_id;

      return ownReaction;
    });
    const rcKeys = message.reaction_counts
      ? Object.keys(message.reaction_counts)
      : [];
    message.reaction_counts = rcKeys.map((type) => {
      const reactionCount = {
        id: `${message.id}${type}${message.reaction_counts[type]}`,
        type,
        count: message.reaction_counts[type],
      };

      return reactionCount;
    });

    return message;
  }

  async insertMessageForChannel(channel_id, message) {
    return await this.insertMessagesForChannel(channel_id, [message]);
  }

  async insertMessagesForChannel(channel_id, messages) {
    const realm = await this.getRealm();
    realm.write(() => {
      const channel = realm.objectForPrimaryKey('Channel', channel_id);
      const rMessages = realm.objects('Message');
      const messageIds = messages.map((m) => m.id);
      const rMessagesToDelete = rMessages.filtered(
        messageIds.map((id) => 'id == "' + id + '"').join(' OR '),
      );

      realm.delete(rMessagesToDelete);
      messages.forEach((m) => {
        const message = realm.create(
          'Message',
          this.getOfflineMessage(m),
          true,
        );
        channel.messages.push(message);
      });
      // // channel.messages.push(messages.map(this.getOfflineMessage));
    });
  }

  async queryMessages() {}
}
