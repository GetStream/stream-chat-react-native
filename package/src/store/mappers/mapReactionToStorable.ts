import type { ReactionResponse } from 'stream-chat';

import { mapTimestampToStorable } from './mapTimestampToStorable';

import type { TableRow } from '../types';

export const mapReactionToStorable = (reaction: ReactionResponse): TableRow<'reactions'> => {
  const { created_at, message_id, score, type, updated_at, user, ...extraData } = reaction;

  return {
    createdAt: mapTimestampToStorable(created_at),
    extraData: JSON.stringify(extraData),
    messageId: message_id,
    score,
    type: type || '',
    updatedAt: mapTimestampToStorable(updated_at),
    userId: user?.id,
  };
};
