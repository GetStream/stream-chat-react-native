/* eslint-disable no-underscore-dangle */
import {
  convertReactionsToRealm,
  convertReactionCountsToRealm,
  getReactionsFromRealmList,
  getReactionCountsFromRealmList,
} from './ReactionMapper';
import {
  convertMentionedUsersToRealm,
  getMentionedUsersFromRealmList,
} from './UserMapper';

export const convertMessagesToRealm = (messages, realm) =>
  [...messages].map((m) => convertMessageToRealm(m, realm));

export const convertMessageToRealm = (m, realm) => {
  const message = {
    id: m.id,
    text: m.text,
    parent_id: m.parent_id,
    command: m.command,
    user: m.user,
    html: m.html,
    type: m.type,
    latest_reactions: m.latest_reactions,
    own_reactions: m.own_reactions,
    reaction_counts: m.reaction_counts,
    show_in_channel: m.show_in_channel,
    reply_count: m.reply_count,
    created_at: m.created_at,
    updated_at: m.updated_at,
    deleted_at: m.deleted_at,
  };

  message.latest_reactions = convertReactionsToRealm(
    message.latest_reactions,
    realm,
  );
  message.own_reactions = convertReactionsToRealm(message.own_reactions, realm);
  message.reaction_counts = convertReactionCountsToRealm(
    message.reaction_counts,
    message.id,
    realm,
  );
  message.mentioned_users = convertMentionedUsersToRealm(
    m.mentioned_users,
    realm,
  );
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

    message.mentioned_users = getMentionedUsersFromRealmList(
      message.mentioned_users,
    );

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
