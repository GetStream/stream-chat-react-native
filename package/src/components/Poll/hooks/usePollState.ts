import { useCallback } from 'react';

import type { PollAnswer, PollOption, PollState, PollVote, UserResponse } from 'stream-chat';

import { usePollStateStore } from './usePollStateStore';

import { usePollContext } from '../../../contexts';

import { DefaultStreamChatGenerics } from '../../../types/types';

export type UsePollStateSelectorReturnType = [
  Record<string, number>,
  Record<string, string>,
  Record<string, PollVote[]>,
  number,
  PollAnswer | undefined,
  PollOption[],
  string,
  number,
  boolean | undefined,
  boolean,
  boolean | undefined,
  boolean | undefined,
  UserResponse | null,
];

const selector = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  nextValue: PollState<StreamChatGenerics>,
): UsePollStateSelectorReturnType => [
  nextValue.vote_counts_by_option,
  nextValue.ownVotesByOptionId,
  nextValue.latest_votes_by_option,
  nextValue.answers_count,
  nextValue.ownAnswer,
  nextValue.options,
  nextValue.name,
  nextValue.max_votes_allowed,
  nextValue.is_closed,
  nextValue.enforce_unique_vote,
  nextValue.allow_answers,
  nextValue.allow_user_suggested_options,
  nextValue.created_by,
];

export const usePollState = () => {
  const { message, poll } = usePollContext();
  const [
    vote_counts_by_option,
    ownVotesByOptionId,
    latest_votes_by_option,
    answers_count,
    ownAnswer,
    options,
    name,
    max_votes_allowed,
    is_closed,
    enforce_unique_vote,
    allow_answers,
    allow_user_suggested_options,
    created_by,
  ] = usePollStateStore(selector);

  const addOption = useCallback(
    (optionText: string) => poll.createOption({ text: optionText }),
    [poll],
  );
  const addComment = useCallback(
    (answerText: string) => poll.addAnswer(answerText, message.id),
    [message.id, poll],
  );
  const endVote = useCallback(() => poll.close(), [poll]);

  return {
    addComment,
    addOption,
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_by,
    endVote,
    enforce_unique_vote,
    is_closed,
    latest_votes_by_option,
    max_votes_allowed,
    name,
    options,
    ownAnswer,
    ownVotesByOptionId,
    vote_counts_by_option,
  };
};
