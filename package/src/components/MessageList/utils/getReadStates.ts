import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const getReadStates = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  clientUserId: string | undefined,
  messages:
    | PaginatedMessageListContextValue<StreamChatGenerics>['messages']
    | ThreadContextValue<StreamChatGenerics>['threadMessages'],
  read?: ChannelContextValue<StreamChatGenerics>['read'],
) => {
  const readData: Record<string, number> = {};

  if (read) {
    /**
     * Array is in reverse order so newest message is at 0,
     * we find the index of the first message that is older
     * than the last read and then set last read to that, or
     * if there are no newer messages, the first message is
     * last read message.
     */
    Object.values(read).forEach((readState) => {
      if (!readState.last_read) return;

      let userLastReadMsgId: string | undefined;

      // loop messages sent by current user and add read data for other users in channel
      messages.forEach((msg) => {
        if (msg.created_at && msg.created_at < readState.last_read) {
          userLastReadMsgId = msg.id;

          // if true, save other user's read data for all messages they've read
          if (!readData[userLastReadMsgId]) {
            readData[userLastReadMsgId] = 0;
          }

          // Only increment read count if the message is not sent by the current user
          if (msg.user?.id !== clientUserId) {
            readData[userLastReadMsgId] = readData[userLastReadMsgId] + 1;
          }
        }
      });

      // if true, only save read data for other user's last read message
      if (userLastReadMsgId) {
        if (!readData[userLastReadMsgId]) {
          readData[userLastReadMsgId] = 0;
        }

        readData[userLastReadMsgId] = readData[userLastReadMsgId] + 1;
      }
    });
  }

  return readData;
};
