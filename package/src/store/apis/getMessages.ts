import type { MessageResponse } from 'stream-chat';

import { getMessagesForChannels } from './queries/getMessagesForChannels';

import { getReactionsForMessages } from './queries/getReactionsForMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import type { JoinedReactionRow } from '../types';

export const getMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channelIds: string[],
) => {
  const messages = getMessagesForChannels(channelIds);
  const messageIds = messages.map(({ id }) => id);

  // Populate the message reactions.
  const reactions = getReactionsForMessages(messageIds);
  const messageIdVsReactions: Record<string, JoinedReactionRow[]> = {};
  reactions.forEach((reaction) => {
    if (!messageIdVsReactions[reaction.messageId]) {
      messageIdVsReactions[reaction.messageId] = [];
    }
    messageIdVsReactions[reaction.messageId].push(reaction);
  });

  // Populate the messages.
  const cidVsMessages: Record<string, MessageResponse<StreamChatGenerics>[]> = {};
  messages.forEach((m) => {
    if (!cidVsMessages[m.cid]) {
      cidVsMessages[m.cid] = [];
    }

    cidVsMessages[m.cid].push(
      mapStorableToMessage<StreamChatGenerics>({
        messageRow: m,
        reactionRows: messageIdVsReactions[m.id],
      }),
    );
  });

  return cidVsMessages;
};
