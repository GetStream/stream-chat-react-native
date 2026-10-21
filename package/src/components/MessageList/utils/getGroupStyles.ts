import { LocalMessage } from 'stream-chat';

import { nsToMs } from 'stream-chat';

import { isEditedMessage } from '../../../utils/utils';

export type MessageGroupStylesParams = {
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
  maxTimeBetweenGroupedMessages?: number;
  dateSeparatorDate?: Date;
  nextMessageDateSeparatorDate?: Date;
};

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

/**
 * Returns the group style of a message: `top`, `bottom`, `middle` or `single`.
 *
 * @param params.message The message to style.
 * @param params.previousMessage The message rendered before it.
 * @param params.nextMessage The message rendered after it.
 * @param params.maxTimeBetweenGroupedMessages Longest gap, in milliseconds, within a group.
 * @param params.nextMessageDateSeparatorDate Date of the separator above the next message, if any.
 * @param params.dateSeparatorDate Date of the separator above the message, if any.
 * @returns An array holding the message's group style.
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

  const userId = message?.user?.id || null;

  const isTopMessage =
    !previousMessage ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'error' ||
    userId !== previousMessage?.user?.id ||
    // A date separator above the message starts a new group.
    dateSeparatorDate ||
    isEditedMessage(previousMessage);

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'error' ||
    userId !== nextMessage?.user?.id ||
    nextMessageDateSeparatorDate ||
    (maxTimeBetweenGroupedMessages !== undefined &&
      nsToMs(nextMessage.created_at - message.created_at) > maxTimeBetweenGroupedMessages) ||
    isEditedMessage(message);

  if (isTopMessage) {
    groupStyles.push('top');
  }

  if (isBottomMessage) {
    // A message that is also the top, or an error, is `single` instead of `bottom`.
    if (isTopMessage || message.type === 'error') {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    } else {
      groupStyles.push('bottom');
    }
  }

  // Neither top nor bottom: `middle`, or `single` for an error.
  if (!isTopMessage && !isBottomMessage) {
    if (message.type === 'error') {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('single');
    } else {
      groupStyles.splice(0, groupStyles.length);
      groupStyles.push('middle');
    }
  }

  return groupStyles;
};
