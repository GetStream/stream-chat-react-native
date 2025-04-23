import { LocalMessage } from 'stream-chat';

import { MessageStatusTypes } from '../../../utils/utils';

export const getLastReceivedMessage = (messages: LocalMessage[]) => {
  /**
   * There are no status on dates so they will be skipped
   */
  for (const message of messages) {
    if (
      message?.status === MessageStatusTypes.RECEIVED ||
      message?.status === MessageStatusTypes.SENDING
    ) {
      return message;
    }
  }

  return;
};
