import { ThreadState } from 'stream-chat';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import { useStateStore } from '../../../hooks';
import type { DefaultStreamChatGenerics } from '../../../types/types';

const selector = (nextValue: ThreadState) =>
  ({
    isLoadingNext: nextValue.pagination.isLoadingNext,
    isLoadingPrev: nextValue.pagination.isLoadingPrev,
    latestReplies: nextValue.replies,
  } as const);

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
  threadInstance,
  threadLoadingMore,
  threadMessages,
}: ThreadContextValue<StreamChatGenerics>) => {
  const { isLoadingNext, isLoadingPrev, latestReplies } =
    useStateStore(threadInstance?.state, selector) ?? {};

  const contextAdapter = threadInstance
    ? {
        loadMoreRecentThread: threadInstance.loadNextPage,
        loadMoreThread: threadInstance.loadPrevPage,
        threadInstance,
        threadLoadingMore: isLoadingPrev,
        threadLoadingMoreRecent: isLoadingNext,
        threadMessages: latestReplies ?? [],
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
