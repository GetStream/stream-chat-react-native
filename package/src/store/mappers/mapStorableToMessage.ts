import type { MessageResponse } from 'stream-chat';

import { mapStorableToReaction } from './mapStorableToReaction';

import { mapStorableToUser } from './mapStorableToUser';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  currentUserId,
  messageRow,
  reactionRows,
}: {
  currentUserId: string;
  messageRow: TableRowJoinedUser<'messages'>;
  reactionRows: TableRowJoinedUser<'reactions'>[];
}): MessageResponse<StreamChatGenerics> => {
  const {
    createdAt,
    deletedAt,
    extraData,
    messageTextUpdatedAt,
    reactionGroups,
    updatedAt,
    user,
    ...rest
  } = messageRow;
  const latestReactions =
    reactionRows?.map((reaction) => mapStorableToReaction<StreamChatGenerics>(reaction)) || [];

  const ownReactions = latestReactions.filter((reaction) => reaction.user?.id === currentUserId);

  return {
    ...rest,
    attachments: messageRow.attachments ? JSON.parse(messageRow.attachments) : [],
    created_at: createdAt,
    deleted_at: deletedAt,
    latest_reactions: latestReactions,
    message_text_updated_at: messageTextUpdatedAt,
    own_reactions: ownReactions,
    reaction_groups: reactionGroups ? JSON.parse(reactionGroups) : {},
    updated_at: updatedAt,
    user: mapStorableToUser(user),
    ...(extraData ? JSON.parse(extraData) : {}),
  };
};
