import { InsertDatesResponse, isDateSeparator } from '../utils/insertDates';

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

export const getLastReceivedMessage = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages: InsertDatesResponse<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  let lastReceivedMessage = null;

  /**
   * There are no status on dates so they will be skipped
   */
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (
      message !== undefined &&
      !isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(message) &&
      message.status !== undefined &&
      message.status === 'received'
    ) {
      lastReceivedMessage = messages[i];
      break;
    }
  }

  return lastReceivedMessage;
};
