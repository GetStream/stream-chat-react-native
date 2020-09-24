import { InsertDatesResponse, isDateSeparator } from '../utils/insertDates';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const getLastReceivedMessage = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
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
