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
  allowThreadMessagesInChannel,
  closeThread,
  loadMoreThread,
  openThread,
  reloadThread,
  setThreadLoadingMore,
  thread,
  threadHasMore,
  threadLoadingMore,
  threadMessages,
}: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const threadId = thread?.id;
  const threadReplyCount = thread?.reply_count;
  const threadMessagesUpdated = threadMessages
    .map(
      ({ deleted_at, latest_reactions, reply_count, status, updated_at }) =>
        `${deleted_at}${
          latest_reactions
            ? latest_reactions.map(({ type }) => type).join()
            : ''
        }${reply_count}${status}${updated_at.toISOString()}`,
    )
    .join();

  const threadContext: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us> = useMemo(
    () => ({
      allowThreadMessagesInChannel,
      closeThread,
      loadMoreThread,
      openThread,
      reloadThread,
      setThreadLoadingMore,
      thread,
      threadHasMore,
      threadLoadingMore,
      threadMessages,
    }),
    [
      allowThreadMessagesInChannel,
      loadMoreThread,
      threadHasMore,
      threadId,
      threadLoadingMore,
      threadMessagesUpdated,
      threadReplyCount,
    ],
  );

  return threadContext;
};
