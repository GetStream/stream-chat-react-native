import type { ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ReactionRow } from '../types';

export const mapReactionToStorable = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  reaction: ReactionResponse<StreamChatGenerics>,
): ReactionRow => {
  const { created_at, message_id, score, type, updated_at, user, ...extraData } = reaction;

  return {
    createdAt: created_at || '',
    extraData: JSON.stringify(extraData),
    id: `${type}-${message_id}-${user?.id}`,
    messageId: message_id,
    score,
    type: type || '',
    updatedAt: updated_at || '',
    user: JSON.stringify(user || {}),
  };
};
