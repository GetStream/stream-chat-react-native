import type { ExtendableGenerics } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const getReadStates = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  clientUserId: string | undefined,
  messages:
    | PaginatedMessageListContextValue<StreamChatClient>['messages']
    | ThreadContextValue<StreamChatClient>['threadMessages'],
  read?: ChannelContextValue<StreamChatClient>['read'],
) => {
  const readData = messages.reduce((acc, cur) => {
    if (cur.id) {
      acc[cur.id] = false;
    }
    return acc;
  }, {} as { [key: string]: boolean | number });

  const filteredMessagesReversed = messages.filter((msg) => msg.updated_at).reverse();

  if (read) {
    /**
     * Channel read state is stored by user and we only care about users who aren't the client
     */
    if (clientUserId) {
      delete read[clientUserId];
    }
    const members = Object.values(read);

    /**
     * Track number of members who have read previous messages
     */
    let memberReadCount = 0;

    /**
     * Array is in reverse order so newest message is at 0,
     * we find the index of the first message that is older
     * than the last read and then set last read to that, or
     * if there are no newer messages, the first message is
     * last read message.
     */
    for (const message of filteredMessagesReversed) {
      /**
       * If all members are removed then they have read these
       * messages. We do not increment memberReadCount for 1:1
       * chats, so this should be true, not a number in that case.
       */
      if (!members.length) {
        readData[message.id] = memberReadCount || true;
      } else {
        for (const member of members) {
          /**
           * If no last read continue, we can't remove the user
           * because this would mark all messages in a new channel
           * true until at least one other user reads a message.
           */
          if (!member.last_read) {
            continue;
          }

          /**
           * If there there is a last read message add the user
           * to the array of last reads for that message and remove
           * the user from the list of users being checked
           */
          if (message.updated_at < member.last_read) {
            /**
             * if this is a direct message the length will be 1
             * as we already deleted the current user from the object
             */
            const numberOfReads = Object.keys(read).length;
            if (numberOfReads === 1) {
              readData[message.id] = true;
            } else {
              const currentMessageReadData = readData[message.id];
              readData[message.id] =
                typeof currentMessageReadData === 'boolean'
                  ? memberReadCount + 1
                  : currentMessageReadData + 1;
            }
            const userIndex = members.findIndex(({ user }) => user.id === member.user?.id);
            if (userIndex !== -1) {
              members.splice(userIndex, 1);
              if (numberOfReads > 1) {
                memberReadCount += 1;
              }
            }
          }
        }

        /**
         * If this is not the last message for a user this will still be
         * set to false. But if other users have read further the number
         * should be how many have read beyond this message.
         */
        if (readData[message.id] === false) {
          readData[message.id] = memberReadCount || false;
        }
      }
    }
  }

  return readData;
};
