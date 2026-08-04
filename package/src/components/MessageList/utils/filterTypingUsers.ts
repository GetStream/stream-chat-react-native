import { EventPayload, TypingUsersState, UserResponse } from 'stream-chat';

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
    const typingEvent = typing[typingKey] as EventPayload<'typing.start' | 'typing.stop'>;
    if (!typingEvent) {
      return;
    }

    /** removes own typing events */
    if (client.user?.id === typingEvent.user?.id) {
      return;
    }

    const isRegularEvent = !typingEvent.parent_id && !threadId;
    const isCurrentThreadEvent = typingEvent.parent_id === threadId;

    /** filters different threads events */
    if (!isRegularEvent && !isCurrentThreadEvent) {
      return;
    }

    const user = typingEvent.user;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  return nonSelfUsers;
};
