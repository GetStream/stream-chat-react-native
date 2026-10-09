import { useRef, useState } from 'react';

import type { MessagePaginator } from 'stream-chat';

import { useStableCallback, useStateStore } from '../../../hooks';

const loadingSelector = (state: { isLoading: boolean; items?: unknown[] }) => ({
  hasMessages: (state.items?.length ?? 0) > 0,
  isLoading: state.isLoading,
});

/**
 * Paging for a message list over `paginator`, the channel's or the open thread's.
 *
 * `loadMore` fetches older messages and `loadMoreRecent` newer ones. The paginator ignores a request
 * while it is already loading or when that end has nothing more, so the list can call these on every
 * scroll event that reaches an edge. A request first waits for one in flight in the other direction,
 * so the two never shift the scroll position under each other.
 */
export const useMessageListPagination = (paginator?: MessagePaginator) => {
  const { hasMessages, isLoading } = useStateStore(paginator?.state, loadingSelector) ?? {};
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const olderRequestRef = useRef<Promise<void>>(undefined);
  const newerRequestRef = useRef<Promise<void>>(undefined);

  const loadMore = useStableCallback(() => {
    olderRequestRef.current ??= (async () => {
      await newerRequestRef.current;
      if (paginator?.hasMoreTail && !paginator.isLoading) {
        setLoadingMore(true);
        try {
          await paginator.toTail();
        } catch {
          // The paginator records the failure in `state.lastQueryError`.
        } finally {
          setLoadingMore(false);
        }
      }
      olderRequestRef.current = undefined;
    })();
    return olderRequestRef.current;
  });

  const loadMoreRecent = useStableCallback(() => {
    newerRequestRef.current ??= (async () => {
      await olderRequestRef.current;
      if (paginator?.hasMoreHead && !paginator.isLoading) {
        setLoadingMoreRecent(true);
        try {
          await paginator.toHead();
        } catch {
          // The paginator records the failure in `state.lastQueryError`.
        } finally {
          setLoadingMoreRecent(false);
        }
      }
      newerRequestRef.current = undefined;
    })();
    return newerRequestRef.current;
  });

  return {
    /** The first page is loading and there is nothing to show yet. */
    loading: isLoading === true && !hasMessages,
    loadingMore,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
  };
};
