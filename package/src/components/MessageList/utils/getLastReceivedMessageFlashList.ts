import { LocalMessage } from 'stream-chat';

import { MessageStatusTypes } from '../../../utils/utils';

export const getLastReceivedMessageFlashList = (messages: LocalMessage[]) => {
  /**
   * There are no status on dates so they will be skipped
   */
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (
      message?.status === MessageStatusTypes.RECEIVED ||
      message?.status === MessageStatusTypes.SENDING
    ) {
      return message;
    }
  }

  return;
};
