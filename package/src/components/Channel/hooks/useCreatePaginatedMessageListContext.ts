import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreatePaginatedMessageListContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
}: PaginatedMessageListContextValue<StreamChatClient> & {
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

  const paginatedMessagesContext: PaginatedMessageListContextValue<StreamChatClient> = useMemo(
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
