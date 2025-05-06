import { PollResponse, VotingVisibility } from 'stream-chat';

import type { TableRow } from '../types';

export const mapStorableToPoll = (pollRow: TableRow<'poll'>): PollResponse => {
  const {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_at,
    created_by,
    created_by_id,
    description,
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers,
    latest_votes_by_option,
    max_votes_allowed,
    name,
    options,
    own_votes,
    updated_at,
    vote_count,
    vote_counts_by_option,
    voting_visibility,
  } = pollRow;

  return {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_at,
    created_by: JSON.parse(created_by),
    created_by_id,
    description,
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers: JSON.parse(latest_answers),
    latest_votes_by_option: JSON.parse(latest_votes_by_option),
    max_votes_allowed,
    name,
    options: JSON.parse(options),
    own_votes: own_votes ? JSON.parse(own_votes) : [],
    updated_at,
    vote_count,
    vote_counts_by_option: JSON.parse(vote_counts_by_option),
    voting_visibility: voting_visibility as VotingVisibility | undefined,
  };
};
