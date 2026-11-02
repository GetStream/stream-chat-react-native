import type { PollResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapPollToStorable = (poll: PollResponse): TableRow<'poll'> => {
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
  } = poll;

  return {
    allow_answers,
    allow_user_suggested_options,
    answers_count,
    created_at: mapDateTimeToStorable(created_at),
    created_by: JSON.stringify(created_by), // decouple the users from the actual poll
    created_by_id,
    description,
    // Always written (as `null` when absent): an upsert skips undefined columns, which would keep
    // translations the server has since dropped, e.g. after the question was edited.
    description_i18n: JSON.stringify(description_i18n ?? null),
    enforce_unique_vote,
    id,
    is_closed,
    latest_answers: JSON.stringify(latest_answers),
    latest_votes_by_option: JSON.stringify(latest_votes_by_option),
    max_votes_allowed,
    name,
    name_i18n: JSON.stringify(name_i18n ?? null),
    options: JSON.stringify(options),
    own_votes: JSON.stringify(own_votes),
    updated_at,
    vote_count,
    vote_counts_by_option: JSON.stringify(vote_counts_by_option),
    voting_visibility,
  };
};
