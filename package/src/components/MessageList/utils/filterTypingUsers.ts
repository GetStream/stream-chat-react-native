import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';

type FilterTypingUsersParams = Pick<TypingContextValue, 'typing'> &
  Pick<ChatContextValue, 'client'> &
  Pick<ThreadContextValue, 'thread'>;

export const filterTypingUsers = ({ client, thread, typing }: FilterTypingUsersParams) => {
  const nonSelfUsers: string[] = [];

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

    const isRegularEvent = !typing[typingKey].parent_id && !thread?.id;
    const isCurrentThreadEvent = typing[typingKey].parent_id === thread?.id;

    /** filters different threads events */
    if (!isRegularEvent && !isCurrentThreadEvent) {
      return;
    }

    const user = typing[typingKey].user?.name || typing[typingKey].user?.id;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  return nonSelfUsers;
};
