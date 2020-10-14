import {
  InsertDatesResponse,
  isDateSeparator,
  Message,
} from '../utils/insertDates';

import type { ImmutableDate } from 'seamless-immutable';
import type { UserResponse } from 'stream-chat';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
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
  Us extends UnknownType = DefaultUserType
>(
  messages: InsertDatesResponse<At, Ch, Co, Ev, Me, Re, Us>,
  read?: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read'],
) => {
  const readData = messages.reduce((acc, cur) => {
    if (!isDateSeparator(cur) && cur.id) {
      acc[cur.id] = [];
    }
    return acc;
  }, {} as { [key: string]: UserResponse<Us>[] });

  const filteredMessagesReversed = messages
    .filter((msg) => !isDateSeparator(msg) && msg.updated_at)
    .reverse() as Array<
    Message<At, Ch, Co, Ev, Me, Re, Us> & {
      updated_at: string | ImmutableDate;
    }
  >;

  if (read) {
    /**
     * Channel read state is stored by user
     */
    for (const readState of Object.values(read)) {
      /**
       * If no last read continue
       */
      if (!readState.last_read) {
        continue;
      }

      /**
       * Array is in reverse order so newest message is at 0,
       * we find the index of the first message that is older
       * than the last read and then set last read to that, or
       * if there are no newer messages, the first message is
       * last read message.
       */
      const userLastReadMsgId = filteredMessagesReversed.find(
        (msg) => msg.updated_at < readState.last_read,
      )?.id;

      /**
       * If there there is a last read message add the user
       * to the array of last reads for that message
       */
      if (userLastReadMsgId) {
        readData[userLastReadMsgId] = [
          ...readData[userLastReadMsgId],
          readState.user as UserResponse<Us>,
        ];
      }
    }
  }

  return readData;
};
