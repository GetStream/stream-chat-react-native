import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const getReadStates = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  clientUserId: string | undefined,
  messages:
    | PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
    | ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'],
  read?: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read'],
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
     * Array is in reverse order so newest message is at 0,
     * we find the index of the first message that is older
     * than the last read and then set last read to that, or
     * if there are no newer messages, the first message is
     * last read message.
     */
    for (const message of filteredMessagesReversed) {
      if (!members.length) {
        readData[message.id] = true;
      } else {
        for (const member of members) {
          /**
           * If no last read continue
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
            if (Object.keys(read).length === 1) {
              readData[message.id] = true;
            } else {
              const currentMessageReadData = readData[message.id];
              readData[message.id] =
                typeof currentMessageReadData === 'boolean' ? 1 : currentMessageReadData + 1;
            }
            const userIndex = members.findIndex(({ user }) => user.id === message.user?.id);
            if (userIndex !== -1) {
              members.splice(userIndex, 1);
            }
          }
        }
      }
    }
  }

  return readData;
};
