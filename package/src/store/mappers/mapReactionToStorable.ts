import type { ReactionResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { ReactionRow } from '../types';

export const mapReactionToStorable = (reaction: ReactionResponse): ReactionRow => {
  const { created_at, message_id, score, type, updated_at, user, ...extraData } = reaction;

  return {
    createdAt: mapDateTimeToStorable(created_at),
    extraData: JSON.stringify(extraData),
    messageId: message_id,
    score,
    type: type || '',
    updatedAt: mapDateTimeToStorable(updated_at),
    userId: user?.id,
  };
};
