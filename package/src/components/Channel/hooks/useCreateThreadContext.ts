import { useMemo } from 'react';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { reduceMessagesToString } from '../../../utils/utils';

export const useCreateThreadContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
}: ThreadContextValue<StreamChatGenerics>) => {
  const threadId = thread?.id;
  const threadReplyCount = thread?.reply_count;
  const threadMessagesStr = reduceMessagesToString(threadMessages);

  const threadContext: ThreadContextValue<StreamChatGenerics> = useMemo(
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
      threadHasMore,
      threadId,
      threadLoadingMore,
      threadMessagesStr,
      threadReplyCount,
    ],
  );

  return threadContext;
};
