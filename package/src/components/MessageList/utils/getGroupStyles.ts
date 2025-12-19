import { LocalMessage } from 'stream-chat';

import { isEditedMessage } from '../../../utils/utils';

export type MessageGroupStylesParams = {
  message: LocalMessage;
  previousMessage: LocalMessage;
  nextMessage: LocalMessage;
  maxTimeBetweenGroupedMessages?: number;
  dateSeparatorDate?: Date;
  nextMessageDateSeparatorDate?: Date;
};

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

/**
 * Get the group styles for a message
 */
export const getGroupStyle = ({
  message,
  previousMessage,
  nextMessage,
  maxTimeBetweenGroupedMessages,
  nextMessageDateSeparatorDate,
  dateSeparatorDate,
}: MessageGroupStylesParams): GroupStyle[] => {
  const groupStyles: GroupStyle[] = [];

  const isPrevMessageTypeDeleted = previousMessage?.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage?.type === 'deleted';

  const userId = message?.user?.id || null;

  const isTopMessage =
    !previousMessage ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'error' ||
    userId !== previousMessage?.user?.id ||
    !!isPrevMessageTypeDeleted ||
    // NOTE: This is needed for the group styles to work after the message separated by date.
    dateSeparatorDate ||
    isEditedMessage(previousMessage);

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'error' ||
    userId !== nextMessage?.user?.id ||
    !!isNextMessageTypeDeleted ||
    nextMessageDateSeparatorDate ||
    (maxTimeBetweenGroupedMessages !== undefined &&
      (nextMessage.created_at as Date).getTime() - (message.created_at as Date).getTime() >
        maxTimeBetweenGroupedMessages) ||
    isEditedMessage(message);

  /**
   * Add group styles key for top message
   */
  if (isTopMessage) {
    groupStyles.push('top');
  }

  /**
   * Add group styles key for bottom message
   */

  const isMessageTypeDeleted = message.type === 'deleted';
  if (isBottomMessage) {
    /**
     * If the bottom message is also the top, or deleted, or an error,
     * add the key for single message instead of bottom
     */
    if (isTopMessage || isMessageTypeDeleted || message.type === 'error') {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    } else {
      groupStyles.push('bottom');
    }
  }

  /**
   * Add the key for all non top or bottom messages, if the message is
   * deleted or an error add the key for single otherwise middle
   */
  if (!isTopMessage && !isBottomMessage) {
    if (isMessageTypeDeleted || message.type === 'error') {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    } else {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('middle');
    }
  }

  return groupStyles;
};
