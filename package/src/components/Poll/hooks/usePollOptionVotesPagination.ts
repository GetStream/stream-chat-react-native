import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import uniqBy from 'lodash/uniqBy';
import { isVoteAnswer, PollOption, PollOptionVotesQueryParams, PollVote } from 'stream-chat';

import { useChatContext, usePollContext } from '../../../contexts';

export type UsePollOptionVotesPaginationParams = {
  option: PollOption;
  loadFirstPage?: boolean;
  paginationParams?: PollOptionVotesQueryParams;
};

export const usePollOptionVotesPagination = ({
  loadFirstPage = true,
  option,
  paginationParams,
}: UsePollOptionVotesPaginationParams) => {
  const { poll } = usePollContext();
  const { client } = useChatContext();

  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const cursorRef = useRef<string | null>();
  const queryInProgress = useRef(false);
  const optionFilter = useMemo(() => ({ option_id: option.id }), [option.id]);

  const loadMore = useCallback(async () => {
    if (cursorRef.current === null || queryInProgress.current) return;
    const next = cursorRef.current;

    setLoading(true);
    queryInProgress.current = true;
    try {
      const { next: newNext, votes } = await poll.queryOptionVotes({
        filter: { ...optionFilter, ...paginationParams?.filter },
        options: !next ? paginationParams?.options : { ...paginationParams?.options, next },
        sort: { created_at: -1, ...paginationParams?.sort },
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
    if (!loadFirstPage || votes.length) return;
    loadMore();
  }, [loadFirstPage, loadMore, votes]);

  // TODO: Possibly generalize these in a utility hook.
  useEffect(() => {
    const castedListeners = ['poll.vote_casted', 'poll.vote_changed'].map((eventName) =>
      client.on(eventName, (event) => {
        if (event.poll?.id && event.poll.id !== poll.id) return;
        const vote = event.poll_vote;
        if (vote && !isVoteAnswer(vote)) {
          if (vote.option_id === option.id) {
            setVotes([vote, ...votes.filter((v) => v.id !== vote.id)]);
          } else if (eventName === 'poll.vote_changed') {
            setVotes(votes.filter((v) => v.id !== vote.id));
          }
        }
      }),
    );

    const removedListener = client.on('poll.vote_removed', (event) => {
      if (event.poll?.id && event.poll.id !== poll.id) return;
      const vote = event.poll_vote;
      if (vote && !isVoteAnswer(vote) && vote.option_id === option.id) {
        setVotes(votes.filter((v) => v.id !== vote.id));
      }
    });

    return () => {
      castedListeners.forEach((listener) => listener.unsubscribe());
      removedListener.unsubscribe();
    };
  }, [client, option, poll, votes]);

  return {
    error,
    hasNextPage: cursorRef.current !== null,
    loading,
    loadMore,
    next: cursorRef.current,
    votes,
  };
};
