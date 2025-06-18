import type { MessageResponse } from 'stream-chat';

import { selectMessagesForChannels } from './queries/selectMessagesForChannels';

import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import { isBlockedMessage } from '../../utils/utils';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';
import type { TableRow, TableRowJoinedUser } from '../types';

export const getChannelMessages = async ({
  channelIds,
  currentUserId,
}: {
  channelIds: string[];
  currentUserId: string;
}) => {
  SqliteClient.logger?.('info', 'getChannelMessages', {
    channelIds,
    currentUserId,
  });
  const messageRows = await selectMessagesForChannels(channelIds);
  const messageIds = messageRows.map(({ id }) => id);

  // Populate the message reactions.
  const reactionRows = await selectReactionsForMessages(messageIds, null);
  const messageIdVsReactions: Record<string, TableRowJoinedUser<'reactions'>[]> = {};
  reactionRows.forEach((reaction) => {
    if (!messageIdVsReactions[reaction.messageId]) {
      messageIdVsReactions[reaction.messageId] = [];
    }
    messageIdVsReactions[reaction.messageId].push(reaction);
  });

  // Populate the polls.
  const messageIdsVsPolls: Record<string, TableRow<'poll'>> = {};
  const pollsById: Record<string, TableRow<'poll'>> = {};
  const messagesWithPolls = messageRows.filter((message) => !!message.poll_id);
  const polls = (await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('poll', ['*'], {
      id: messagesWithPolls.map((message) => message.poll_id),
    }),
  )) as unknown as TableRow<'poll'>[];
  polls.forEach((poll) => {
    pollsById[poll.id] = poll;
  });
  messagesWithPolls.forEach((message) => {
    messageIdsVsPolls[message.poll_id] = pollsById[message.poll_id];
  });

  // Populate the messages.
  const cidVsMessages: Record<string, MessageResponse[]> = {};
  messageRows.forEach((m) => {
    if (!cidVsMessages[m.cid]) {
      cidVsMessages[m.cid] = [];
    }

    if (!isBlockedMessage(m)) {
      cidVsMessages[m.cid].push(
        mapStorableToMessage({
          currentUserId,
          messageRow: m,
          pollRow: messageIdsVsPolls[m.poll_id],
          reactionRows: messageIdVsReactions[m.id],
        }),
      );
    }
  });

  return cidVsMessages;
};
