import { useCallback, useEffect, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import type { PollAnswersQueryParams, PollVoteResponseData } from 'stream-chat';
import { isVoteAnswer } from 'stream-chat';

import { useChatContext, usePollContext } from '../../../contexts';

export type UsePollAnswersPaginationParams = {
  loadFirstPage?: boolean;
  paginationParams?: PollAnswersQueryParams;
};

export type UsePollAnswersReturnType = {
  error: Error | undefined;
  hasNextPage: boolean;
  loading: boolean;
  loadMore: () => void;
  next: string | null | undefined;
  pollAnswers: PollVoteResponseData[];
};

/**
 * Queries the answers of the poll in context page by page, for when `latest_answers` in the poll
 * state does not hold enough of them. `pollAnswers` stays in sync with answer events for the poll.
 *
 * @param params.loadFirstPage Loads the first page on mount. Defaults to true.
 * @param params.paginationParams Filter, sort and options merged into every query.
 * @returns The loaded answers with the pagination state and `loadMore`.
 */
export const usePollAnswersPagination = ({
  loadFirstPage = true,
  paginationParams,
}: UsePollAnswersPaginationParams = {}): UsePollAnswersReturnType => {
  const { poll } = usePollContext();
  const { client } = useChatContext();

  const [pollAnswers, setPollAnswers] = useState<PollVoteResponseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const cursorRef = useRef<string | null>(undefined);
  const queryInProgress = useRef(false);

  const loadMore = useCallback(async () => {
    if (cursorRef.current === null || queryInProgress.current) {
      return;
    }
    const next = cursorRef.current;

    setLoading(true);
    queryInProgress.current = true;
    try {
      const { next: newNext, votes: answers } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: [{ direction: -1, field: 'updated_at' }, ...(paginationParams?.sort ?? [])],
      });
      cursorRef.current = newNext || null;
      setPollAnswers((prev) => uniqBy([...prev, ...answers], 'id'));
    } catch (e) {
      setError(e as Error);
    }
    queryInProgress.current = false;
    setLoading(false);
  }, [paginationParams, poll]);

  useEffect(() => {
    if (!loadFirstPage || pollAnswers.length) {
      return;
    }
    loadMore();
  }, [loadFirstPage, loadMore, pollAnswers]);

  useEffect(() => {
    const castedListeners = (['poll.vote_casted', 'poll.vote_changed'] as const).map((eventName) =>
      client.on(eventName, (event) => {
        if (event.poll?.id && event.poll.id !== poll.id) {
          return;
        }
        const vote = event.poll_vote;
        if (vote && isVoteAnswer(vote)) {
          setPollAnswers((prev) => [vote, ...prev.filter((answer) => answer.id !== vote.id)]);
        }
      }),
    );

    const removedListener = client.on('poll.vote_removed', (event) => {
      if (event.poll?.id && event.poll.id !== poll.id) {
        return;
      }
      const vote = event.poll_vote;
      if (vote && isVoteAnswer(vote)) {
        setPollAnswers((prev) => prev.filter((item) => item.id !== vote.id));
      }
    });

    return () => {
      castedListeners.forEach((listener) => listener.unsubscribe());
      removedListener.unsubscribe();
    };
  }, [client, poll]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    loading,
    loadMore,
    next: cursorRef.current,
    pollAnswers,
  };
};
