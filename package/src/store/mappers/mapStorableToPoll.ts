import type { PollResponseData } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';

import type { TableRow } from '../types';

export const mapStorableToPoll = (pollRow: TableRow<'poll'>): PollResponseData => {
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
    allow_answers: Boolean(allow_answers),
    allow_user_suggested_options: Boolean(allow_user_suggested_options),
    answers_count,
    created_at: mapStorableToTimestamp(created_at) ?? 0,
    created_by: JSON.parse(created_by),
    created_by_id,
    custom: {},
    description: description ?? '',
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers: JSON.parse(latest_answers),
    latest_votes_by_option: JSON.parse(latest_votes_by_option),
    max_votes_allowed,
    name,
    options: JSON.parse(options),
    own_votes: own_votes ? JSON.parse(own_votes) : [],
    updated_at: mapStorableToTimestamp(updated_at) ?? 0,
    vote_count,
    vote_counts_by_option: JSON.parse(vote_counts_by_option),
    // `voting_visibility` is `'anonymous' | 'public'` on the response, and the column is TEXT.
    // The `?? ''` fallback was never a valid value — it only compiled because the date fields on
    // this same object literal were already failing and masking it. Default to the API's default.
    voting_visibility: (voting_visibility as PollResponseData['voting_visibility']) ?? 'public',
  };
};
