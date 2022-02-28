import type { DateSeparators } from './getDateSeparators';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { GroupType } from '../hooks/useMessageList';

export type GetGroupStylesParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  dateSeparators: DateSeparators;
  messages:
    | PaginatedMessageListContextValue<StreamChatGenerics>['messages']
    | ThreadContextValue<StreamChatGenerics>['threadMessages'];
  hideDateSeparators?: boolean;
  maxTimeBetweenGroupedMessages?: number;
  noGroupByUser?: boolean;
  userId?: string;
};

export const getGroupStyles = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  params: GetGroupStylesParams<StreamChatGenerics>,
) => {
  const {
    dateSeparators,
    hideDateSeparators,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    userId,
  } = params;

  if (noGroupByUser) return {};

  const messageGroupStyles: { [key: string]: GroupType[] } = {};

  const messagesFilteredForNonUser = messages.filter((message) => {
    const isMessageTypeDeleted = message.type === 'deleted';
    return !isMessageTypeDeleted || userId === message.user?.id;
  });

  for (let i = 0; i < messagesFilteredForNonUser.length; i++) {
    const previousMessage = messagesFilteredForNonUser[i - 1] as
      | typeof messagesFilteredForNonUser[0]
      | undefined;
    const message = messagesFilteredForNonUser[i];
    const nextMessage = messagesFilteredForNonUser[i + 1] as
      | typeof messagesFilteredForNonUser[0]
      | undefined;
    const groupStyles: GroupType[] = [];

    const isPrevMessageTypeDeleted = previousMessage?.type === 'deleted';
    const isNextMessageTypeDeleted = nextMessage?.type === 'deleted';

    const userId = message?.user?.id || null;

    const isTopMessage =
      !previousMessage ||
      previousMessage.type === 'system' ||
      userId !== previousMessage?.user?.id ||
      previousMessage.type === 'error' ||
      !!isPrevMessageTypeDeleted ||
      (!hideDateSeparators && dateSeparators[message.id]) ||
      messageGroupStyles[previousMessage.id]?.includes('bottom');

    const isBottomMessage =
      !nextMessage ||
      nextMessage.type === 'system' ||
      userId !== nextMessage?.user?.id ||
      nextMessage.type === 'error' ||
      !!isNextMessageTypeDeleted ||
      (!hideDateSeparators && dateSeparators[nextMessage.id]) ||
      (maxTimeBetweenGroupedMessages !== undefined &&
        nextMessage.created_at.getTime() - message.created_at.getTime() >
          maxTimeBetweenGroupedMessages);

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

    if (message.id) {
      messageGroupStyles[message.id] = groupStyles;
    }
  }

  return messageGroupStyles;
};
