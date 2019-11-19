/* eslint-disable no-underscore-dangle */
import {
  convertReactionsToRealm,
  convertReactionCountsToRealm,
  getReactionsFromRealmList,
  getReactionCountsFromRealmList,
} from './ReactionMapper';
import { convertUsersToRealm, getUsersFromRealmList } from './UserMapper';

export const convertMessagesToRealm = (messages, realm) =>
  messages.map((m) => convertMessageToRealm(m, realm));

export const convertMessageToRealm = (m, realm) => {
  // reactotron.log('convertMessageToRealm', m);
  const message = {
    id: m.id,
    text: m.text,
    parent_id: m.parent_id,
    command: m.command,
    user: m.user,
    html: m.html,
    type: m.type,
    // latest_reactions: [...m.latest_reactions],
    own_reactions: [...m.own_reactions],
    mentioned_users: [...m.mentioned_users],
    reaction_counts: { ...m.reaction_counts },
    show_in_channel: m.show_in_channel,
    reply_count: m.reply_count,
    created_at: m.created_at,
    updated_at: m.updated_at,
    deleted_at: m.deleted_at,
  };

  const latestReactions = m.latest_reactions.map((r) => ({ ...r }));
  message.latest_reactions = convertReactionsToRealm(latestReactions, realm);
  message.own_reactions = convertReactionsToRealm(message.own_reactions, realm);
  message.reaction_counts = convertReactionCountsToRealm(
    message.reaction_counts,
    message.id,
    realm,
  );
  message.mentioned_users = convertUsersToRealm(message.mentioned_users, realm);
  message.user = realm.create('User', message.user, true);
  return realm.create('Message', message, true);
};

export const getMessagesFromRealmList = (ml) => {
  const messages = [];
  for (const m of ml) {
    const message = {
      ...m,
      attachments: [],
    };

    message.mentioned_users = getUsersFromRealmList(message.mentioned_users);

    message.latest_reactions = getReactionsFromRealmList(
      message.latest_reactions,
    );
    message.own_reactions = getReactionsFromRealmList(message.own_reactions);
    message.reaction_counts = getReactionCountsFromRealmList(
      message.reaction_counts,
    );

    delete message.channel;
    messages.push(message);
  }

  return messages;
};
