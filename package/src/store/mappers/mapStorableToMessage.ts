import type { MessageResponse } from 'stream-chat';

import { mapStorableToReaction } from './mapStorableToReaction';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { MessageRow, ReactionRow } from '../types';

export const mapStorableToMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  messageRow,
  reactionRows,
}: {
  messageRow: MessageRow;
  reactionRows: ReactionRow[];
}): MessageResponse<StreamChatGenerics> => {
  const { createdAt, deletedAt, extraData, reactionCounts, updatedAt, ...rest } = messageRow;
  const latestReactions = reactionRows?.map((reaction) => mapStorableToReaction(reaction)) || [];
  const ownReactions = latestReactions.filter((reaction) => reaction.user?.id === 'neil');

  return {
    ...rest,
    attachments: messageRow.attachments ? JSON.parse(messageRow.attachments) : [],
    created_at: createdAt,
    deleted_at: deletedAt,
    latest_reactions: latestReactions,
    own_reactions: ownReactions,
    reaction_counts: reactionCounts ? JSON.parse(reactionCounts) : {},
    updated_at: updatedAt,
    user: messageRow.user ? JSON.parse(messageRow.user) : {},
    ...JSON.parse(extraData || '{}'),
  };
};
