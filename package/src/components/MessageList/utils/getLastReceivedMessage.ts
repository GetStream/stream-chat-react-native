import { MessageStatusTypes } from '../../../utils/utils';

import type { MessageType } from '../hooks/useMessageList';

export const getLastReceivedMessage = (messages: MessageType[]) => {
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
