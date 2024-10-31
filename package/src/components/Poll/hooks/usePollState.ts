import { useCallback } from 'react';

import {
  APIResponse,
  CastVoteAPIResponse,
  PollAnswer,
  PollOption,
  PollState,
  PollVote,
  UpdatePollAPIResponse,
  UserResponse,
  VotingVisibility,
} from 'stream-chat';

import { usePollStateStore } from './usePollStateStore';

import { usePollContext } from '../../../contexts';

import { DefaultStreamChatGenerics } from '../../../types/types';

export type UsePollStateSelectorReturnType = {
  allow_answers: boolean | undefined;
  allow_user_suggested_options: boolean | undefined;
  answers_count: number;
  created_by: UserResponse | null;
  enforce_unique_vote: boolean;
  is_closed: boolean | undefined;
  latest_votes_by_option: Record<string, PollVote[]>;
  max_votes_allowed: number;
  maxVotedOptionIds: string[];
  name: string;
  options: PollOption[];
  ownAnswer: PollAnswer | undefined;
  ownVotesByOptionId: Record<string, PollVote>;
  vote_counts_by_option: Record<string, number>;
  voting_visibility: VotingVisibility | undefined;
};

export type UsePollStateReturnType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = UsePollStateSelectorReturnType & {
  addComment: (
    answerText: string,
  ) => Promise<APIResponse & CastVoteAPIResponse<StreamChatGenerics>>;
  addOption: (optionText: string) => Promise<void>;
  endVote: () => Promise<APIResponse & UpdatePollAPIResponse<StreamChatGenerics>>;
};

const selector = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  nextValue: PollState<StreamChatGenerics>,
): UsePollStateSelectorReturnType => ({
  allow_answers: nextValue.allow_answers,
  allow_user_suggested_options: nextValue.allow_user_suggested_options,
  answers_count: nextValue.answers_count,
  created_by: nextValue.created_by,
  enforce_unique_vote: nextValue.enforce_unique_vote,
  is_closed: nextValue.is_closed,
  latest_votes_by_option: nextValue.latest_votes_by_option,
  max_votes_allowed: nextValue.max_votes_allowed,
  maxVotedOptionIds: nextValue.maxVotedOptionIds,
  name: nextValue.name,
  options: nextValue.options,
  ownAnswer: nextValue.ownAnswer,
  ownVotesByOptionId: nextValue.ownVotesByOptionId,
  vote_counts_by_option: nextValue.vote_counts_by_option,
  voting_visibility: nextValue.voting_visibility,
});

export const usePollState = (): UsePollStateReturnType => {
  const { message, poll } = usePollContext();
  const {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_by,
    enforce_unique_vote,
    is_closed,
    latest_votes_by_option,
    max_votes_allowed,
    maxVotedOptionIds,
    name,
    options,
    ownAnswer,
    ownVotesByOptionId,
    vote_counts_by_option,
    voting_visibility,
  } = usePollStateStore(selector);

  const addOption = useCallback(
    async (optionText: string) => {
      const { poll_option } = await poll.createOption({ text: optionText });
      await poll.castVote(poll_option.id, message.id);
    },
    [message, poll],
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
    maxVotedOptionIds,
    name,
    options,
    ownAnswer,
    ownVotesByOptionId,
    vote_counts_by_option,
    voting_visibility,
  };
};
