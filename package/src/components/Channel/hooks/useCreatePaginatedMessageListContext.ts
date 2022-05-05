import { useMemo } from 'react';
import { mapMessages } from 'src/utils/utils';

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
  
  const messagesUpdated = messages.map((props) => mapMessages(props)).join();

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
