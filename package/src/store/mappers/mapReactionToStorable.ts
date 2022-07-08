import type { ReactionResponse } from 'stream-chat';

import { mapDateTimeToStorable } from './mapDateTimeToStorable';

import type { TableRow } from '../types';

export const mapReactionToStorable = (reaction: ReactionResponse): TableRow<'reactions'> => {
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
