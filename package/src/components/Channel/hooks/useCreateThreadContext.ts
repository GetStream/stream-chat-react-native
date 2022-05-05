import { useMemo } from 'react';
import { mapMessages } from 'src/utils/utils';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

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
  const threadMessagesUpdated = threadMessages.map((props) => mapMessages(props)).join();

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
      threadMessagesUpdated,
      threadReplyCount,
    ],
  );

  return threadContext;
};
