import { useCallback, useEffect, useMemo } from 'react';

import type { PollAnswer, PollAnswersQueryParams } from 'stream-chat';

import { usePollContext } from '../../../contexts';
import { PaginationFn, useCursorPaginator } from '../../../hooks/useCursorPaginator';
import { DefaultStreamChatGenerics } from '../../../types/types';

type UsePollAnswersPaginationParams = {
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswersPagination = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({ paginationParams }: UsePollAnswersPaginationParams = {}) => {
  const { latestCastOrUpdatedAnswer, latestRemovedAnswer, poll } = usePollContext();

  // fixme: proper response type
  const paginationFn = useCallback<PaginationFn<PollAnswer<StreamChatGenerics>>>(
    async (next) => {
      const { next: newNext, votes } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
      });
      return { items: votes, next: newNext };
    },
    [paginationParams, poll],
  );

  const { error, hasNextPage, items, loading, loadMore, next } = useCursorPaginator(
    paginationFn,
    true,
  );

  const pollAnswers1 = useMemo(() => {
    if (latestCastOrUpdatedAnswer) {
      return [
        latestCastOrUpdatedAnswer,
        ...items.filter((item) => item.user_id !== latestCastOrUpdatedAnswer.user_id),
      ];
    }

    return items;
  }, [items, latestCastOrUpdatedAnswer]);
  const pollAnswers = useMemo(() => {
    if (latestRemovedAnswer) {
      return pollAnswers1.filter((item) => item.user_id === latestRemovedAnswer.user_id);
    }
    return pollAnswers1;
  }, [latestRemovedAnswer, pollAnswers1]);

  return {
    error,
    hasNextPage,
    loading,
    loadMore,
    next,
    pollAnswers,
  };
};
