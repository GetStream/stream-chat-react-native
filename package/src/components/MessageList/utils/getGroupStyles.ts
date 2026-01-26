import { LocalMessage } from 'stream-chat';

import type { DateSeparators } from './getDateSeparators';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

import { isEditedMessage } from '../../../utils/utils';
import type { GroupType } from '../hooks/useMessageList';

export type MessageGroupStylesParams = {
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
  maxTimeBetweenGroupedMessages?: number;
  dateSeparatorDate?: Date;
  nextMessageDateSeparatorDate?: Date;
};

/**
 * @deprecated in favor of `useMessageGroupStyles` hook instead directly in the Message.
 */
export type GetGroupStylesParams = {
  dateSeparators: DateSeparators;
  messages: PaginatedMessageListContextValue['messages'] | ThreadContextValue['threadMessages'];
  /**
   * @deprecated in favor of `useDateSeparator` hook instead directly in the Message.
   */
  hideDateSeparators?: boolean;
  maxTimeBetweenGroupedMessages?: number;
  noGroupByUser?: boolean;
  /**
   * @deprecated
   */
  userId?: string;
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

/**
 * @deprecated in favor of `useMessageGroupStyles` hook instead directly in the Message.
 */
export const getGroupStyles = (params: GetGroupStylesParams) => {
  const { dateSeparators, maxTimeBetweenGroupedMessages, messages, noGroupByUser } = params;

  if (noGroupByUser) {
    return {};
  }

  const messageGroupStyles: { [key: string]: GroupType[] } = {};

  for (let i = 0; i < messages.length; i++) {
    const previousMessage = messages[i - 1];
    const message = messages[i];
    const nextMessage = messages[i + 1];

    if (message.id) {
      messageGroupStyles[message.id] = getGroupStyle({
        dateSeparatorDate: dateSeparators[message.id],
        maxTimeBetweenGroupedMessages,
        message,
        nextMessage,
        previousMessage,
      });
    }
  }

  return messageGroupStyles;
};
