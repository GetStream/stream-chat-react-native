import type { MessageResponse } from 'stream-chat';

import { selectMessagesForChannels } from './queries/selectMessagesForChannels';

import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { isBlockedMessage } from '../../utils/utils';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { QuickSqliteClient } from '../QuickSqliteClient';
import type { TableRowJoinedUser } from '../types';

export const getChannelMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}) => {
  QuickSqliteClient.logger?.('info', 'getChannelMessages', {
    channelIds,
    currentUserId,
  });
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

    if (!isBlockedMessage(m)) {
      cidVsMessages[m.cid].push(
        mapStorableToMessage<StreamChatGenerics>({
          currentUserId,
          messageRow: m,
          reactionRows: messageIdVsReactions[m.id],
        }),
      );
    }
  });

  return cidVsMessages;
};
