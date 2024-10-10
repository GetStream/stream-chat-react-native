import { useCallback, useEffect, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import type { PollAnswer, PollAnswersQueryParams } from 'stream-chat';
import { isVoteAnswer } from 'stream-chat';

import { useChatContext, usePollContext } from '../../../contexts';

type UsePollAnswersPaginationParams = {
  loadFirstPage?: boolean;
  paginationParams?: PollAnswersQueryParams;
};

export const usePollAnswersPagination = ({
  loadFirstPage = true,
  paginationParams,
}: UsePollAnswersPaginationParams = {}) => {
  const { poll } = usePollContext();
  const { client } = useChatContext();

  const [pollAnswers, setPollAnswers] = useState<PollAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const cursorRef = useRef<string | null>();
  const queryInProgress = useRef(false);

  const loadMore = useCallback(async () => {
    if (cursorRef.current === null || queryInProgress.current) return;
    const next = cursorRef.current;

    setLoading(true);
    queryInProgress.current = true;
    try {
      const { next: newNext, votes: answers } = await poll.queryAnswers({
        filter: paginationParams?.filter,
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
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
    if (!loadFirstPage || pollAnswers.length) return;
    loadMore();
  }, [loadFirstPage, loadMore, pollAnswers]);

  useEffect(() => {
    const castedListeners = ['poll.vote_casted', 'poll.vote_changed'].map((eventName) =>
      client.on(eventName, (event) => {
        if (event.poll?.id && event.poll.id !== poll.id) return;
        const vote = event.poll_vote;
        if (vote && isVoteAnswer(vote)) {
          setPollAnswers([
            vote,
            ...pollAnswers.filter((answer) => answer.user_id !== vote.user_id),
          ]);
        }
      }),
    );

    const removedListener = client.on('poll.vote_removed', (event) => {
      if (event.poll?.id && event.poll.id !== poll.id) return;
      const vote = event.poll_vote;
      if (vote && isVoteAnswer(vote)) {
        setPollAnswers(pollAnswers.filter((item) => item.user_id !== vote.user_id));
      }
    });

    return () => {
      castedListeners.forEach((listener) => listener.unsubscribe());
      removedListener.unsubscribe();
    };
  }, [client, pollAnswers]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    loading,
    loadMore,
    next: cursorRef.current,
    pollAnswers,
  };
};
