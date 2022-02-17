import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreatePaginatedMessageListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelId,
  hasMore,
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
  const messagesUpdated = messages
    .map(
      ({ deleted_at, latest_reactions, reply_count, status, updated_at }) =>
        `${deleted_at}${
          latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
        }${reply_count}${status}${updated_at.toISOString()}`,
    )
    .join();

  const paginatedMessagesContext: PaginatedMessageListContextValue<StreamChatGenerics> = useMemo(
    () => ({
      hasMore,
      loadingMore,
      loadingMoreRecent,
      loadMore,
      loadMoreRecent,
      messages,
      setLoadingMore,
      setLoadingMoreRecent,
    }),
    [channelId, hasMore, loadingMoreRecent, loadingMore, messagesUpdated],
  );

  return paginatedMessagesContext;
};
