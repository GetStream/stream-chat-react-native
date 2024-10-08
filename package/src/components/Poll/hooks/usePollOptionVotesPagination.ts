import { useCallback } from 'react';

import type { PollAnswer, PollOptionVotesQueryParams, PollVote } from 'stream-chat';

import { usePollContext } from '../../../contexts';
import { PaginationFn, useCursorPaginator } from '../../../hooks/useCursorPaginator';
import { DefaultStreamChatGenerics } from '../../../types/types';

type UsePollOptionVotesPaginationParams = {
  paginationParams: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const { poll } = usePollContext();

  // fixme: proper response type
  const paginationFn = useCallback<
    PaginationFn<PollVote<StreamChatGenerics> | PollAnswer<StreamChatGenerics>>
  >(
    async (next) => {
      const { next: newNext, votes } = await poll.queryOptionVotes({
        filter: paginationParams.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const {
    error,
    hasNextPage,
    items: votes,
    loading,
    loadMore,
    next,
  } = useCursorPaginator(paginationFn, true);

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    next,
    votes,
  };
};
