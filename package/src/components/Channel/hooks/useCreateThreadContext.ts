import { LocalMessage } from 'stream-chat';

import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import { useStateStore } from '../../../hooks';

type ThreadMessagePaginatorState = {
  hasMoreHead: boolean;
  hasMoreTail: boolean;
  isLoading: boolean;
  items?: LocalMessage[];
};

// Reply list is sourced from the thread's messagePaginator (optimistic thread ops write there,
// not to the legacy state.replies). tailward === older replies (loadMoreThread); headward ===
// newer replies (loadMoreRecentThread).
const selector = (state: ThreadMessagePaginatorState) => ({
  hasMore: state.hasMoreTail,
  isLoading: state.isLoading,
  messages: state.items,
});

export const useCreateThreadContext = ({
  allowThreadMessagesInChannel,
  onAlsoSentToChannelHeaderPress,
  loadMoreThread,
  reloadThread,
  setThreadLoadingMore,
  thread,
  threadHasMore,
  threadInstance,
  threadLoadingMore,
}: Omit<ThreadContextValue, 'threadMessages'>) => {
  const { hasMore, isLoading, messages } =
    useStateStore(threadInstance?.messagePaginator?.state, selector) ?? {};

  const contextAdapter = threadInstance
    ? {
        loadMoreRecentThread: async () => {
          await threadInstance.messagePaginator.toHead();
        },
        loadMoreThread: async () => {
          await threadInstance.messagePaginator.toTail();
        },
        threadHasMore: hasMore ?? false,
        threadInstance,
        threadLoadingMore: !!isLoading,
      }
    : {};

  return {
    allowThreadMessagesInChannel,
    onAlsoSentToChannelHeaderPress,
    loadMoreThread,
    reloadThread,
    setThreadLoadingMore,
    thread,
    threadHasMore,
    threadLoadingMore,
    // The reply list is sourced solely from the thread's messagePaginator (optimistic thread ops
    // write there). Empty when no thread is open (threadInstance null); the list only reads this
    // when threadList is true, i.e. a thread is open and threadInstance is set.
    threadMessages: messages ?? [],
    ...contextAdapter,
  };
};
