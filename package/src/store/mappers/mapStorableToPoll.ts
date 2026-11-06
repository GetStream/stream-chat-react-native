import type { PollResponseData } from 'stream-chat';

import { mapStorableToRequiredTimestamp } from './mapStorableToTimestamp';

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
    description_i18n,
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers,
    latest_votes_by_option,
    max_votes_allowed,
    name,
    name_i18n,
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
    created_at: mapStorableToRequiredTimestamp(created_at),
    created_by: JSON.parse(created_by),
    created_by_id,
    custom: {},
    description: description ?? '',
    description_i18n: description_i18n ? (JSON.parse(description_i18n) ?? undefined) : undefined,
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers: JSON.parse(latest_answers),
    latest_votes_by_option: JSON.parse(latest_votes_by_option),
    max_votes_allowed,
    name,
    name_i18n: name_i18n ? (JSON.parse(name_i18n) ?? undefined) : undefined,
    options: JSON.parse(options),
    own_votes: own_votes ? JSON.parse(own_votes) : [],
    updated_at: mapStorableToRequiredTimestamp(updated_at),
    vote_count,
    vote_counts_by_option: JSON.parse(vote_counts_by_option),
    // The column is TEXT, while the response type is `'anonymous' | 'public'`. A missing value
    // falls back to the API default.
    voting_visibility: (voting_visibility as PollResponseData['voting_visibility']) ?? 'public',
  };
};
