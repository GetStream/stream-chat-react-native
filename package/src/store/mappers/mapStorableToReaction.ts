import type { ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { ReactionRow } from '../types';

export const mapStorableToReaction = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  reactionRow: ReactionRow,
): ReactionResponse<StreamChatGenerics> => {
  const { createdAt, extraData, messageId, score, type, updatedAt, user } = reactionRow;

  return {
    created_at: createdAt,
    message_id: messageId,
    score,
    type,
    updated_at: updatedAt,
    user: user ? JSON.parse(user) : {},
    ...JSON.parse(extraData || '{}'),
  };
};
