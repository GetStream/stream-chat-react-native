import type { MessageResponse } from 'stream-chat';

import { mapStorableToReaction } from './mapStorableToReaction';

import { mapStorableToUser } from './mapStorableToUser';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { JoinedMessageRow, JoinedReactionRow } from '../types';

export const mapStorableToMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  currentUserId,
  messageRow,
  reactionRows,
}: {
  currentUserId: string;
  messageRow: JoinedMessageRow;
  reactionRows: JoinedReactionRow[];
}): MessageResponse<StreamChatGenerics> => {
  const { createdAt, deletedAt, extraData, reactionCounts, updatedAt, user, ...rest } = messageRow;
  const latestReactions =
    reactionRows?.map((reaction) => mapStorableToReaction<StreamChatGenerics>(reaction)) || [];

  const ownReactions = latestReactions.filter((reaction) => reaction.user?.id === currentUserId);

  return {
    ...rest,
    attachments: messageRow.attachments ? JSON.parse(messageRow.attachments) : [],
    created_at: createdAt,
    deleted_at: deletedAt,
    latest_reactions: latestReactions,
    own_reactions: ownReactions,
    reaction_counts: reactionCounts ? JSON.parse(reactionCounts) : {},
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...JSON.parse(extraData || '{}'),
  };
};
