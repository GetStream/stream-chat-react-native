import { convertUsersToStorable, convertUserToStorable } from './UserMapper';
import { convertReactionsToStorable } from './ReactionMapper';
import { getChannelMessagesKey } from '../keys';

export const convertMessageToStorable = (m, storables) => {
  const message = { ...m };

  message.user = convertUserToStorable(m.user, storables);
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
