import { LocalMessage } from 'stream-chat';

import type { DateSeparators } from './getDateSeparators';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

import { isEditedMessage } from '../../../utils/utils';
import type { GroupType } from '../hooks/useMessageList';

export type GetGroupStylesParams = {
  dateSeparators: DateSeparators;
  messages: PaginatedMessageListContextValue['messages'] | ThreadContextValue['threadMessages'];
  hideDateSeparators?: boolean;
  maxTimeBetweenGroupedMessages?: number;
  noGroupByUser?: boolean;
  userId?: string;
};

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

const getGroupStyle = (
  dateSeparators: DateSeparators,
  message: LocalMessage,
  previousMessage: LocalMessage,
  nextMessage: LocalMessage,
  hideDateSeparators?: boolean,
  maxTimeBetweenGroupedMessages?: number,
): GroupStyle[] => {
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
    (!hideDateSeparators && dateSeparators[previousMessage.id]) ||
    isEditedMessage(previousMessage);

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'error' ||
    userId !== nextMessage?.user?.id ||
    !!isNextMessageTypeDeleted ||
    (!hideDateSeparators && dateSeparators[nextMessage.id]) ||
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

export const getGroupStyles = (params: GetGroupStylesParams) => {
  const {
    dateSeparators,
    hideDateSeparators,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    userId,
  } = params;

  if (noGroupByUser) {
    return {};
  }

  const messageGroupStyles: { [key: string]: GroupType[] } = {};

  const messagesFilteredForNonUser = messages.filter((message) => {
    const isMessageTypeDeleted = message.type === 'deleted';
    return !isMessageTypeDeleted || userId === message.user?.id;
  });

  for (let i = 0; i < messagesFilteredForNonUser.length; i++) {
    const previousMessage = messagesFilteredForNonUser[i - 1];
    const message = messagesFilteredForNonUser[i];
    const nextMessage = messagesFilteredForNonUser[i + 1];

    if (message.id) {
      messageGroupStyles[message.id] = getGroupStyle(
        dateSeparators,
        message,
        previousMessage,
        nextMessage,
        hideDateSeparators,
        maxTimeBetweenGroupedMessages,
      );
    }
  }

  return messageGroupStyles;
};
