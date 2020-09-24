import type { UnknownType, UserResponse } from 'stream-chat';

import { InsertDatesResponse, isDateSeparator } from '../utils/insertDates';

import type { ChannelContextValue } from '../../../contexts/channelContext/ChannelContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
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
  const readData: { [key: string]: UserResponse<Us>[] } = {};

  for (const message of messages) {
    /**
     * Filter out date separators
     */
    if (isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(message)) {
      continue;
    }

    /**
     * Create empty array for each message id
     */
    if (message.id) {
      readData[message.id] = [];
    }
  }

  if (read) {
    /**
     * Channel read state is stored by user
     */
    for (const readState of Object.values(read)) {
      /**
       * If no last read break
       * TODO: Check if this is needed or if continue should be used instead
       */
      if (readState.last_read == null) {
        break;
      }

      /**
       * Find the last message before the last_read
       */
      let userLastReadMsgId;
      for (const msg of messages) {
        if (
          !isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(msg) &&
          msg.updated_at &&
          msg.updated_at < readState.last_read
        ) {
          userLastReadMsgId = msg.id;
        }
      }

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
