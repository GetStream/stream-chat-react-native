import type { ChannelMemberResponse, MessageResponse } from 'stream-chat';

import { selectMembersForChannels } from './queries/selectMembersForChannels';

import { selectMessages } from './queries/selectMessages';

import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToMember } from '../mappers/mapStorableToMember';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import type { TableRowJoinedUser } from '../types';

export const getMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  currentUserId,
  messageIds,
}: {
  currentUserId: string;
  messageIds: string[];
}) => {
  const messageRows = selectMessages(messageIds);

  // Populate the message reactions.
  const reactionRows = selectReactionsForMessages(messageIds);
  const messageIdVsReactions: Record<string, TableRowJoinedUser<'reactions'>[]> = {};
  reactionRows.forEach((reaction) => {
    if (!messageIdVsReactions[reaction.messageId]) {
      messageIdVsReactions[reaction.messageId] = [];
    }
    messageIdVsReactions[reaction.messageId].push(reaction);
  });

  // Populate the messages.
  return messageRows.map((m) =>
    mapStorableToMessage<StreamChatGenerics>({
      currentUserId,
      messageRow: m,
      reactionRows: messageIdVsReactions[m.id],
    }),
  );
};
