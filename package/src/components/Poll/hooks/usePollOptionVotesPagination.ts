import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import {
  isVoteAnswer,
  PollOptionResponseData,
  PollOptionVotesQueryParams,
  PollVoteResponseData,
} from 'stream-chat';

import { useChatContext, usePollContext } from '../../../contexts';

export type UsePollOptionVotesPaginationParams = {
  option: PollOptionResponseData;
  loadFirstPage?: boolean;
  paginationParams?: PollOptionVotesQueryParams;
};

export type UsePollVotesReturnType = {
  error: Error | undefined;
  hasNextPage: boolean;
  loading: boolean;
  loadMore: () => void;
  next: string | null | undefined;
  votes: PollVoteResponseData[];
};

/**
 * Queries the votes of one poll option page by page, for when `latestVotesByOption` in the poll
 * state does not hold enough of them. `votes` stays in sync with vote events for the option.
 *
 * @param params.option The option to load the votes of.
 * @param params.loadFirstPage Loads the first page on mount. Defaults to true.
 * @param params.paginationParams Filter, sort and options merged into every query.
 * @returns The loaded votes with the pagination state and `loadMore`.
 */
export const usePollOptionVotesPagination = ({
  loadFirstPage = true,
  option,
  paginationParams,
}: UsePollOptionVotesPaginationParams): UsePollVotesReturnType => {
  const { poll } = usePollContext();
  const { client } = useChatContext();

  const [votes, setVotes] = useState<PollVoteResponseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const cursorRef = useRef<string | null>(undefined);
  const queryInProgress = useRef(false);
  const optionId = option.id;
  const optionFilter = useMemo(() => ({ option_id: optionId }), [optionId]);

  const loadMore = useCallback(async () => {
    if (cursorRef.current === null || queryInProgress.current) {
      return;
    }
    const next = cursorRef.current;

    setLoading(true);
    queryInProgress.current = true;
    try {
      const { next: newNext, votes } = await poll.queryOptionVotes({
        filter: { ...optionFilter, ...paginationParams?.filter },
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: [{ direction: -1, field: 'created_at' }, ...(paginationParams?.sort ?? [])],
      });
      cursorRef.current = newNext || null;
      setVotes((prev) => uniqBy([...prev, ...votes], 'id'));
    } catch (e) {
      setError(e as Error);
    }
    queryInProgress.current = false;
    setLoading(false);
  }, [optionFilter, paginationParams, poll]);

  useEffect(() => {
    if (!loadFirstPage || votes.length) {
      return;
    }
    loadMore();
  }, [loadFirstPage, loadMore, votes]);

  // TODO: Possibly generalize these in a utility hook.
  useEffect(() => {
    const castedListeners = (['poll.vote_casted', 'poll.vote_changed'] as const).map((eventName) =>
      client.on(eventName, (event) => {
        if (event.poll?.id && event.poll.id !== poll.id) {
          return;
        }
        const vote = event.poll_vote;
        if (vote && !isVoteAnswer(vote)) {
          if (vote.option_id === optionId) {
            setVotes((prev) => [vote, ...prev.filter((v) => v.id !== vote.id)]);
          } else if (eventName === 'poll.vote_changed') {
            setVotes((prev) => prev.filter((v) => v.id !== vote.id));
          }
        }
      }),
    );

    const removedListener = client.on('poll.vote_removed', (event) => {
      if (event.poll?.id && event.poll.id !== poll.id) {
        return;
      }
      const vote = event.poll_vote;
      if (vote && !isVoteAnswer(vote) && vote.option_id === optionId) {
        setVotes((prev) => prev.filter((v) => v.id !== vote.id));
      }
    });

    return () => {
      castedListeners.forEach((listener) => listener.unsubscribe());
      removedListener.unsubscribe();
    };
  }, [client, optionId, poll]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    loading,
    loadMore,
    next: cursorRef.current,
    votes,
  };
};
