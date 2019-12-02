/* eslint-disable no-underscore-dangle */
import {
  convertReactionsToRealm,
  convertReactionCountsToRealm,
  getReactionsFromRealmList,
  getReactionCountsFromRealmList,
} from './ReactionMapper';
import {
  convertAttachmentsToRealm,
  getAttachmentsFromRealmList,
} from './AttachmentMapper';
import { convertUsersToRealm, getUsersFromRealmList } from './UserMapper';

export const convertMessagesToRealm = (messages, realm) =>
  messages.map((m) => convertMessageToRealm(m, realm));

function isValidDate(d) {
  let date = d;

  if (typeof d === 'string') {
    date = new Date(d);
  }

  return date instanceof Date && !isNaN(date);
}

export const convertMessageToRealm = (m, realm, forceUpdate = false) => {
  const {
    id,
    text,
    parent_id,
    command,
    attachments,
    user,
    html = '',
    type = 'regular',
    mentioned_users,
    latest_reactions,
    own_reactions,
    reaction_counts,
    show_in_channel,
    reply_count,
    created_at,
    updated_at,
    deleted_at,
    status = 'received',
    ...extraData
  } = m;
  if (!forceUpdate) {
    const existingMessage = realm.objectForPrimaryKey('Message', id);
    if (existingMessage && existingMessage.updated_at) {
      if (existingMessage.updated_at.toString() === updated_at.toString()) {
        return existingMessage;
      }
    }
  }
  // reactotron.log('convertMessageToRealm', m);
  const message = {
    id,
    text,
    parent_id,
    command,
    user,
    html,
    type,
    latest_reactions: latest_reactions ? [...m.latest_reactions] : [],
    own_reactions: own_reactions ? [...m.own_reactions] : [],
    mentioned_users: mentioned_users ? [...m.mentioned_users] : [],
    reaction_counts: reaction_counts ? { ...m.reaction_counts } : [],
    attachments: attachments ? [...m.attachments] : [],
    show_in_channel,
    reply_count,
    status,
    extraData: JSON.stringify(extraData),
  };

  if (isValidDate(updated_at)) {
    message.updated_at = updated_at;
  }

  if (isValidDate(deleted_at)) {
    message.deleted_at = deleted_at;
  }

  if (isValidDate(created_at)) {
    message.created_at = created_at;
  } else {
    message.created_at = new Date();
  }

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

  message.mentioned_users = convertUsersToRealm(message.mentioned_users, realm);

  message.attachments = convertAttachmentsToRealm(message.attachments, realm);

  if (message.user) {
    message.user = realm.create('User', message.user, true);
  }

  return realm.create('Message', message, true);
};

export const getMessagesFromRealmList = (ml) => {
  // return [];
  const messages = [];
  for (const m of ml) {
    const extraData = m.extraData ? JSON.parse(m.extraData) : {};
    const message = {
      id: m.id,
      text: m.text,
      parent_id: m.parent_id,
      command: m.command,
      user: m.user,
      html: m.html,
      type: m.type,
      show_in_channel: m.show_in_channel,
      reply_count: m.reply_count,
      created_at: m.created_at,
      updated_at: m.updated_at,
      status: m.status,
      deleted_at: m.deleted_at,
      ...extraData,
    };
    message.attachments = getAttachmentsFromRealmList(m.attachments);
    message.mentioned_users = getUsersFromRealmList(m.mentioned_users);

    message.latest_reactions = getReactionsFromRealmList(m.latest_reactions);
    message.own_reactions = getReactionsFromRealmList(m.own_reactions);
    message.reaction_counts = getReactionCountsFromRealmList(m.reaction_counts);

    delete message.extraData;
    messages.push(message);
  }

  return messages;
};
