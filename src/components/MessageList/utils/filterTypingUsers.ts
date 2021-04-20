import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { TypingContextValue } from '../../../contexts/typingContext/TypingContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

type FilterTypingUsersParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<TypingContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'typing'> &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'thread'>;

export const filterTypingUsers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  client,
  thread,
  typing,
}: FilterTypingUsersParams<At, Ch, Co, Ev, Me, Re, Us>) => {
  const typingKeys = Object.keys(typing);
  const nonSelfUsers: string[] = [];
  typingKeys.forEach((typingKey) => {
    // removes own typing events
    if (client?.user?.id === typing?.[typingKey]?.user?.id) {
      return;
    }

    const isRegularEvent = !typing?.[typingKey].parent_id && !thread?.id;
    const isCurrentThreadEvent = typing?.[typingKey].parent_id === thread?.id;

    // filters different threads events
    if (!isRegularEvent && !isCurrentThreadEvent) {
      return;
    }

    const user =
      typing?.[typingKey]?.user?.name || typing?.[typingKey]?.user?.id;
    if (user) {
      nonSelfUsers.push(user);
    }
  });

  return nonSelfUsers;
};
