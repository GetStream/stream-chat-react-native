import type { ReactionResponse } from 'stream-chat';

import { mapStorableToUser } from './mapStorableToUser';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { JoinedReactionRow } from '../types';

export const mapStorableToReaction = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  reactionRow: JoinedReactionRow,
): ReactionResponse<StreamChatGenerics> => {
  const { createdAt, extraData, messageId, score, type, updatedAt, user } = reactionRow;

  return {
    created_at: createdAt,
    message_id: messageId,
    score,
    type,
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...JSON.parse(extraData || '{}'),
  };
};
