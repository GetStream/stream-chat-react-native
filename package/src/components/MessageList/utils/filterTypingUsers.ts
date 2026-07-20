import { TypingUsersState, UserResponse } from 'stream-chat';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';

type FilterTypingUsersParams = { threadId?: string; typing: TypingUsersState['typing'] } & Pick<
  ChatContextValue,
  'client'
>;

export const filterTypingUsers = ({ client, threadId, typing }: FilterTypingUsersParams) => {
  const nonSelfUsers: UserResponse[] = [];

  if (!client || !client.user || !typing) {
    return nonSelfUsers;
  }

  const typingKeys = Object.keys(typing);

  typingKeys.forEach((typingKey) => {
    if (!typing[typingKey]) {
      return;
    }

    /** removes own typing events */
    if (client.user?.id === typing[typingKey].user?.id) {
      return;
    }

    const isRegularEvent = !typing[typingKey].parent_id && !threadId;
    const isCurrentThreadEvent = typing[typingKey].parent_id === threadId;

    /** filters different threads events */
    if (!isRegularEvent && !isCurrentThreadEvent) {
      return;
    }

    const user = typing[typingKey].user;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  return nonSelfUsers;
};
