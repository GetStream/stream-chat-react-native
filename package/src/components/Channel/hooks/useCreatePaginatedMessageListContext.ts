import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { reduceMessagesToString } from '../../../utils/utils';

export const useCreatePaginatedMessageListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
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
}: PaginatedMessageListContextValue<StreamChatGenerics> & {
  channelId?: string;
}) => {
  const messagesStr = reduceMessagesToString(messages);

  const paginatedMessagesContext: PaginatedMessageListContextValue<StreamChatGenerics> = useMemo(
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
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, hasMore, loadingMore, loadingMoreRecent, messagesStr],
  );

  return paginatedMessagesContext;
};
