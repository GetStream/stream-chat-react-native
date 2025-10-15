import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';

import { reduceMessagesToString } from '../../../utils/utils';

export const useCreatePaginatedMessageListContext = ({
  channelId,
  hasMore,
  loadingMore,
  loadingMoreRecent,
  loadLatestMessages,
  loadMore,
  loadMoreRecent,
  messages,
  setLoadingMore,
  setLoadingMoreRecent,
  viewabilityChangedCallback,
}: PaginatedMessageListContextValue & {
  channelId?: string;
}) => {
  const messagesStr = reduceMessagesToString(messages);

  const paginatedMessagesContext: PaginatedMessageListContextValue = useMemo(
    () => ({
      hasMore,
      loadingMore,
      loadingMoreRecent,
      loadLatestMessages,
      loadMore,
      loadMoreRecent,
      messages,
      setLoadingMore,
      setLoadingMoreRecent,
      viewabilityChangedCallback,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, hasMore, loadingMore, loadingMoreRecent, messagesStr, viewabilityChangedCallback],
  );

  return paginatedMessagesContext;
};
