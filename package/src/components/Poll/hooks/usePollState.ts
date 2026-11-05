import { useCallback } from 'react';

import {
  APIResponse,
  CastVoteAPIResponse,
  PollAnswer,
  PollOption,
  PollState,
  PollVote,
  TranslatedField,
  UpdatePollAPIResponse,
  UserResponse,
  VotingVisibility,
} from 'stream-chat';

import { useEndVote } from './useEndVote';
import { usePollStateStore } from './usePollStateStore';

import { usePollContext } from '../../../contexts';

export type UsePollStateSelectorReturnType = {
  allowAnswers: boolean | undefined;
  allowUserSuggestedOptions: boolean | undefined;
  answersCount: number;
  createdBy: UserResponse | null;
  enforceUniqueVote: boolean;
  isClosed: boolean | undefined;
  latestVotesByOption: Record<string, PollVote[]>;
  maxVotedOptionIds: string[];
  maxVotesAllowed: number;
  name: string;
  nameI18n: TranslatedField | undefined;
  options: PollOption[];
  ownAnswer: PollAnswer | undefined;
  ownVotesByOptionId: Record<string, PollVote>;
  voteCountsByOption: Record<string, number>;
  votingVisibility: VotingVisibility | undefined;
  voteCount: number;
};

export type UsePollStateReturnType = UsePollStateSelectorReturnType & {
  addComment: (answerText: string) => Promise<APIResponse & CastVoteAPIResponse>;
  addOption: (optionText: string) => Promise<void>;
  endVote: () => Promise<(APIResponse & UpdatePollAPIResponse) | undefined>;
};

const selector = (nextValue: PollState): UsePollStateSelectorReturnType => ({
  allowAnswers: nextValue.allow_answers,
  allowUserSuggestedOptions: nextValue.allow_user_suggested_options,
  answersCount: nextValue.answers_count,
  createdBy: nextValue.created_by,
  enforceUniqueVote: nextValue.enforce_unique_vote,
  isClosed: nextValue.is_closed,
  latestVotesByOption: nextValue.latest_votes_by_option,
  maxVotedOptionIds: nextValue.maxVotedOptionIds,
  maxVotesAllowed: nextValue.max_votes_allowed,
  name: nextValue.name,
  nameI18n: nextValue.name_i18n,
  options: nextValue.options,
  ownAnswer: nextValue.ownAnswer,
  ownVotesByOptionId: nextValue.ownVotesByOptionId,
  voteCountsByOption: nextValue.vote_counts_by_option,
  votingVisibility: nextValue.voting_visibility,
  voteCount: nextValue.vote_count,
});

export const usePollState = (): UsePollStateReturnType => {
  const { message, poll } = usePollContext();
  const {
    allowAnswers,
    allowUserSuggestedOptions,
    answersCount,
    createdBy,
    enforceUniqueVote,
    isClosed,
    latestVotesByOption,
    maxVotedOptionIds,
    maxVotesAllowed,
    name,
    nameI18n,
    options,
    ownAnswer,
    ownVotesByOptionId,
    voteCountsByOption,
    votingVisibility,
    voteCount,
  } = usePollStateStore(selector);

  const addOption = useCallback(
    async (optionText: string) => {
      await poll.createOption({ text: optionText });
    },
    [poll],
  );
  const addComment = useCallback(
    (answerText: string) => poll.addAnswer(answerText, message.id),
    [message.id, poll],
  );
  const endVote = useEndVote();

  return {
    addComment,
    addOption,
    allowAnswers,
    allowUserSuggestedOptions,
    answersCount,
    createdBy,
    endVote,
    enforceUniqueVote,
    isClosed,
    latestVotesByOption,
    maxVotedOptionIds,
    maxVotesAllowed,
    name,
    nameI18n,
    options,
    ownAnswer,
    ownVotesByOptionId,
    voteCountsByOption,
    votingVisibility,
    voteCount,
  };
};
