import { convertUsersToStorable, convertUserToStorable } from './UserMapper';
import { convertReactionsToStorable } from './ReactionMapper';
import { getChannelMessagesKey } from '../keys';

export const convertMessageToStorable = (m, storables) => {
  const message = {
    id: m.id,
    text: m.text,
    parent_id: m.parent_id,
    command: m.command,
    attachments: m.attachments,
    user: convertUserToStorable(m.user, storables),
    html: m.html,
    type: m.type,
    mentioned_users: [...m.mentioned_users],
    latest_reactions: [...m.latest_reactions],
    own_reactions: [...m.own_reactions],
    reaction_counts: { ...m.reaction_counts },
    show_in_channel: m.show_in_channel,
    reply_count: m.reply_count,
    created_at: m.created_at,
    updated_at: m.updated_at,
    deleted_at: m.deleted_at,
  };

  message.mentioned_users = convertUsersToStorable(
    message.mentioned_users,
    storables,
  );

  message.latest_reactions = convertReactionsToStorable(
    message.latest_reactions,
    storables,
  );

  message.own_reactions = convertReactionsToStorable(
    message.own_reactions,
    storables,
  );

  return message;
};
export const convertMessagesToStorable = (messages, channelId, storables) => {
  const storableMessages = messages.map((m) =>
    convertMessageToStorable(m, storables),
  );

  storables[getChannelMessagesKey(channelId)] = storableMessages;

  return getChannelMessagesKey(channelId);
};
