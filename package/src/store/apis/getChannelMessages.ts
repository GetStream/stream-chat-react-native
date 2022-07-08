import type { MessageResponse } from 'stream-chat';

import { selectMessagesForChannels } from './queries/selectMessagesForChannels';

import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import type { TableRowJoinedUser } from '../types';

export const getMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}) => {
  const messageRows = selectMessagesForChannels(channelIds);
  const messageIds = messageRows.map(({ id }) => id);

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
  const cidVsMessages: Record<string, MessageResponse<StreamChatGenerics>[]> = {};
  messageRows.forEach((m) => {
    if (!cidVsMessages[m.cid]) {
      cidVsMessages[m.cid] = [];
    }

    cidVsMessages[m.cid].push(
      mapStorableToMessage<StreamChatGenerics>({
        currentUserId,
        messageRow: m,
        reactionRows: messageIdVsReactions[m.id],
      }),
    );
  });

  return cidVsMessages;
};
