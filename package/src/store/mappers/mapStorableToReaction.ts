import type { ReactionResponse } from 'stream-chat';

import { mapStorableToUser } from './mapStorableToUser';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToReaction = (
  reactionRow: TableRowJoinedUser<'reactions'>,
): ReactionResponse => {
  const { createdAt, extraData, messageId, score, type, updatedAt, user } = reactionRow;

  return {
    created_at: createdAt,
    message_id: messageId,
    score,
    type,
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
