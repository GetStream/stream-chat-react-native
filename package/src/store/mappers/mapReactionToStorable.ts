import type { ReactionResponse } from 'stream-chat';

import type { ReactionRow } from '../types';

export const mapReactionToStorable = (reaction: ReactionResponse): ReactionRow => {
  const { created_at, message_id, score, type, updated_at, user, ...extraData } = reaction;

  return {
    createdAt: created_at || '',
    extraData: JSON.stringify(extraData),
    messageId: message_id,
    score,
    type: type || '',
    updatedAt: updated_at || '',
    userId: user?.id,
  };
};
