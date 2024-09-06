import { ThreadState } from 'stream-chat';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import { useStateStore } from '../../../hooks';
import type { DefaultStreamChatGenerics } from '../../../types/types';

const selector = (nextValue: ThreadState) =>
  [
    nextValue.replies,
    nextValue.pagination.isLoadingPrev,
    nextValue.pagination.isLoadingNext,
    nextValue.parentMessage,
  ] as const;

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
  const [latestReplies, isLoadingPrev, isLoadingNext, parentMessage] =
    useStateStore(thread?.state, selector) ?? [];

  // console.log('ISE: LATEST REPLIES TEST: ', threadMessages.length, latestReplies?.length, thread?.activate)

  const contextAdapter = thread?.activate
    ? {
        loadMoreRecentThread: thread.loadNextPage,
        loadMoreThread: thread.loadPrevPage,
        thread: parentMessage,
        threadLoadingMore: isLoadingPrev,
        threadLoadingMoreRecent: isLoadingNext,
        threadMessages: latestReplies,
      }
    : {};

  return {
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
    ...contextAdapter,
  };
};
