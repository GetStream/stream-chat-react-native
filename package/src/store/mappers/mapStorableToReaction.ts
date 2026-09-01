import type { ReactionResponse } from 'stream-chat';

import { mapStorableToTimestamp } from './mapStorableToTimestamp';
import { mapStorableToUser } from './mapStorableToUser';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToReaction = (
  reactionRow: TableRowJoinedUser<'reactions'>,
): ReactionResponse => {
  const { createdAt, extraData, messageId, score, type, updatedAt, user } = reactionRow;

  return {
    created_at: mapStorableToTimestamp(createdAt),
    message_id: messageId,
    score,
    type,
    updated_at: mapStorableToTimestamp(updatedAt),
    user: mapStorableToUser(user),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
