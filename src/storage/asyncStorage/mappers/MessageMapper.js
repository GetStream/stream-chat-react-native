import { convertUsersToStorable, convertUserToStorable } from './UserMapper';
import { convertReactionsToStorable } from './ReactionMapper';
import { getChannelMessagesKey } from '../keys';

export const convertMessageToStorable = (m, storables, appUserId) => {
  // Ignore threads for now
  if (m.parent_id && m.parent_id.length > 0) return;

  const message = { ...m };

  message.user = convertUserToStorable(m.user, storables, appUserId);
  message.mentioned_users = convertUsersToStorable(
    message.mentioned_users,
    storables,
    appUserId,
  );

  message.latest_reactions = convertReactionsToStorable(
    message.latest_reactions,
    storables,
    appUserId,
  );

  message.own_reactions = convertReactionsToStorable(
    message.own_reactions,
    storables,
    appUserId,
  );

  return message;
};
export const convertMessagesToStorable = (
  messages,
  channelId,
  storables,
  appUserId,
) => {
  const storableMessages = messages.map((m) =>
    convertMessageToStorable(m, storables, appUserId),
  );

  storables[getChannelMessagesKey(appUserId, channelId)] = storableMessages;

  return getChannelMessagesKey(appUserId, channelId);
};
