import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { reduceMessagesToString } from '../../../utils/utils';

export const useCreatePaginatedMessageListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelId,
  hasMore,
  hasNoMoreRecentMessagesToLoad,
  loadingMore,
  loadingMoreRecent,
  loadMore,
  loadMoreRecent,
  messages,
  setLoadingMore,
  setLoadingMoreRecent,
}: PaginatedMessageListContextValue<StreamChatGenerics> & {
  channelId?: string;
}) => {
  const messagesStr = reduceMessagesToString(messages);

  const paginatedMessagesContext: PaginatedMessageListContextValue<StreamChatGenerics> = useMemo(
    () => ({
      hasMore,
      hasNoMoreRecentMessagesToLoad,
      loadingMore,
      loadingMoreRecent,
      loadMore,
      loadMoreRecent,
      messages,
      setLoadingMore,
      setLoadingMoreRecent,
    }),
    [channelId, hasMore, loadingMoreRecent, loadingMore, messagesStr],
  );

  return paginatedMessagesContext;
};
