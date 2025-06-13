import type { MessageResponse } from 'stream-chat';

import { mapStorableToPoll } from './mapStorableToPoll';
import { mapStorableToReaction } from './mapStorableToReaction';

import { mapStorableToUser } from './mapStorableToUser';

import type { TableRow, TableRowJoinedUser } from '../types';

export const mapStorableToMessage = ({
  currentUserId,
  messageRow,
  pollRow,
  reactionRows,
}: {
  currentUserId: string;
  messageRow: TableRowJoinedUser<'messages'>;
  pollRow: TableRow<'poll'>;
  reactionRows?: TableRowJoinedUser<'reactions'>[];
}): MessageResponse => {
  const {
    createdAt,
    deletedAt,
    extraData,
    messageTextUpdatedAt,
    poll_id,
    reactionGroups,
    updatedAt,
    user,
    ...rest
  } = messageRow;
  const latestReactions = reactionRows?.map((reaction) => mapStorableToReaction(reaction)) || [];

  const ownReactions = latestReactions.filter((reaction) => reaction.user?.id === currentUserId);

  return {
    ...rest,
    attachments: messageRow.attachments ? JSON.parse(messageRow.attachments) : [],
    created_at: createdAt,
    deleted_at: deletedAt,
    latest_reactions: latestReactions,
    message_text_updated_at: messageTextUpdatedAt,
    own_reactions: ownReactions,
    poll_id,
    reaction_groups: reactionGroups ? JSON.parse(reactionGroups) : {},
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...(pollRow ? { poll: mapStorableToPoll(pollRow) } : {}),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
