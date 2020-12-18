import { useMemo } from 'react';

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

export const useCreateThreadContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  closeThread,
  loadMoreThread,
  openThread,
  thread,
  threadHasMore,
  threadLoadingMore,
  threadMessages,
}: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const threadId = thread?.id;
  const threadMessageLength = threadMessages.length;

  const threadContext: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      closeThread,
      loadMoreThread,
      openThread,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessages,
    }),
    [threadHasMore, threadId, threadLoadingMore, threadMessageLength],
  );

  return threadContext;
};
