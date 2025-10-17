import type { MessageResponse } from 'stream-chat';

import { mapStorableToPoll } from './mapStorableToPoll';
import { mapStorableToReaction } from './mapStorableToReaction';

import { mapStorableToReminder } from './mapStorableToReminder';
import { mapStorableToUser } from './mapStorableToUser';

import type { TableRow, TableRowJoinedUser } from '../types';

export const mapStorableToMessage = ({
  currentUserId,
  messageRow,
  pollRow,
  reactionRows,
  reminderRow,
}: {
  currentUserId: string;
  messageRow: TableRowJoinedUser<'messages'>;
  pollRow: TableRow<'poll'>;
  reactionRows?: TableRowJoinedUser<'reactions'>[];
  reminderRow?: TableRow<'reminders'>;
}): MessageResponse => {
  const {
    createdAt,
    deletedAt,
    deletedForMe,
    extraData,
    messageTextUpdatedAt,
    poll_id,
    reactionGroups,
    shared_location,
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
    deleted_for_me: deletedForMe,
    latest_reactions: latestReactions,
    message_text_updated_at: messageTextUpdatedAt,
    own_reactions: ownReactions,
    poll_id,
    reaction_groups: reactionGroups ? JSON.parse(reactionGroups) : {},
    shared_location: shared_location ? JSON.parse(shared_location) : null,
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...(pollRow ? { poll: mapStorableToPoll(pollRow) } : {}),
    ...(extraData ? JSON.parse(extraData) : {}),
    ...(reminderRow ? { reminder: mapStorableToReminder(reminderRow) } : {}),
  };
};
