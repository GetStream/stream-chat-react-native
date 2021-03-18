import { useMemo } from 'react';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const useCreatePaginatedMessageListContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  hasMore,
  loadingMore,
  loadingMoreRecent,
  loadMore,
  loadMoreRecent,
  messages,
  setLoadingMore,
  setLoadingMoreRecent,
}: PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>) => {
  const messagesUpdated = messages
    .map(
      ({ deleted_at, latest_reactions, reply_count, status, updated_at }) =>
        `${deleted_at}${
          latest_reactions
            ? latest_reactions.map(({ type }) => type).join()
            : ''
        }${reply_count}${status}${updated_at.toISOString()}`,
    )
    .join();

  const paginatedMessagesContext: PaginatedMessageListContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  > = useMemo(
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
    [hasMore, loadingMoreRecent, loadingMore, messagesUpdated],
  );

  return paginatedMessagesContext;
};
