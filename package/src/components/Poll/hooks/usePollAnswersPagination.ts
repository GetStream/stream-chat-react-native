import { useCallback, useEffect, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import type { PollAnswer, PollAnswersQueryParams } from 'stream-chat';
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
  pollAnswers: PollAnswer[];
};

/**
 * A hook that queries answers for a given Poll and returns them in a paginated fashion.
 * Should be used instead of the latest_answers property within the reactive state in the
 * event that we need more than the top 10 answers. The returned property pollAnswers will
 * automatically be updated and trigger a state change when paginating further.
 *
 * @param loadFirstPage {boolean} Signifies whether the first page should be automatically loaded whenever
 * the hook is first called.
 * @param paginationParams {PollAnswersQueryParams} The pagination params we might want to use for our custom
 * needs when invoking the hook.
 *
 * @returns {UsePollAnswersReturnType} An object containing all of the needed pagination values as well as the
 * answers.
 **/
export const usePollAnswersPagination = ({
  loadFirstPage = true,
  paginationParams,
}: UsePollAnswersPaginationParams = {}): UsePollAnswersReturnType => {
  const { poll } = usePollContext();
  const { client } = useChatContext();

  const [pollAnswers, setPollAnswers] = useState<PollAnswer[]>([]);
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
        sort: { updated_at: -1, ...paginationParams?.sort },
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
    const castedListeners = ['poll.vote_casted', 'poll.vote_changed'].map((eventName) =>
      client.on(eventName, (event) => {
        if (event.poll?.id && event.poll.id !== poll.id) {
          return;
        }
        const vote = event.poll_vote;
        if (vote && isVoteAnswer(vote)) {
          setPollAnswers([vote, ...pollAnswers.filter((answer) => answer.id !== vote.id)]);
        }
      }),
    );

    const removedListener = client.on('poll.vote_removed', (event) => {
      if (event.poll?.id && event.poll.id !== poll.id) {
        return;
      }
      const vote = event.poll_vote;
      if (vote && isVoteAnswer(vote)) {
        setPollAnswers(pollAnswers.filter((item) => item.id !== vote.id));
      }
    });

    return () => {
      castedListeners.forEach((listener) => listener.unsubscribe());
      removedListener.unsubscribe();
    };
  }, [client, poll, pollAnswers]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    loading,
    loadMore,
    next: cursorRef.current,
    pollAnswers,
  };
};
