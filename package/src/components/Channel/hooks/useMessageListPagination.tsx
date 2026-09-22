import { useState } from 'react';

import { Channel, LocalMessage } from 'stream-chat';

import { useStableCallback, useStateStore } from '../../../hooks';

export const DEFAULT_HIGHLIGHT_DURATION = 3000;

type MessagePaginatorState = {
  hasMoreHead: boolean;
  hasMoreTail: boolean;
  isLoading: boolean;
  items?: LocalMessage[];
};

// Direction mapping (stream-chat MessagePaginator):
//   tailward === id_lt === OLDER messages  -> loadMore / hasMore
//   headward === id_gt === NEWER messages  -> loadMoreRecent / hasMoreNewer
const selector = (state: MessagePaginatorState) => ({
  hasMore: state.hasMoreTail,
  hasMoreNewer: state.hasMoreHead,
  isLoading: state.isLoading,
  messages: state.items,
});

/**
 * Pagination proper: the directional loads and their loading flags. Only the message-list components
 * use this — it subscribes to the paginator, so anything calling it re-renders per publish.
 */
export const useMessageListPagination = ({ channel }: { channel: Channel }) => {
  const paginator = channel.messagePaginator;

  const { hasMore, hasMoreNewer, isLoading, messages } =
    useStateStore(paginator.state, selector) ?? {};

  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);

  /**
   * Loads older messages (before the oldest loaded message).
   */
  const loadMore = useStableCallback(async () => {
    if (!paginator.hasMoreTail || paginator.isLoading) {
      return;
    }
    setLoadingMore(true);
    try {
      await paginator.toTail();
    } catch (e) {
      console.warn('Message pagination(fetching old messages) request failed with error:', e);
    } finally {
      setLoadingMore(false);
    }
  });

  /**
   * Loads newer messages (after the most recent loaded message).
   */
  const loadMoreRecent = useStableCallback(async () => {
    if (!paginator.hasMoreHead || paginator.isLoading) {
      return;
    }
    setLoadingMoreRecent(true);
    try {
      await paginator.toHead();
    } catch (e) {
      console.warn('Message pagination(fetching new messages) request failed with error:', e);
    } finally {
      setLoadingMoreRecent(false);
    }
  });

  return {
    loadMore,
    loadMoreRecent,
    state: {
      hasMore,
      hasMoreNewer,
      loading: !!isLoading && !messages?.length,
      loadingMore,
      loadingMoreRecent,
      messages,
    },
  };
};
