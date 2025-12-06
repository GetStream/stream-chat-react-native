import type { DeletedMessagesVisibilityType } from '../../../contexts/messagesContext/MessagesContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

/**
 * @deprecated in favor of `useDateSeparator` hook instead directly in the Message.
 */
export type GetDateSeparatorsParams = {
  messages: PaginatedMessageListContextValue['messages'] | ThreadContextValue['threadMessages'];
  /**
   * @deprecated The computations are done ahead of time in the useMessageList hook so this parameter is no longer needed.
   */
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  hideDateSeparators?: boolean;
  /**
   * @deprecated The computations are done ahead of time in the useMessageList hook so this parameter is no longer needed.
   */
  userId?: string;
};

export type DateSeparators = {
  [key: string]: Date;
};

/**
 * @deprecated in favor of `useDateSeparator` hook instead directly in the Message.
 */
export const getDateSeparators = (params: GetDateSeparatorsParams) => {
  const { hideDateSeparators, messages } = params;
  const dateSeparators: DateSeparators = {};

  if (hideDateSeparators) {
    return dateSeparators;
  }

  for (let i = 0; i < messages.length; i++) {
    const previousMessage = messages[i - 1];
    const message = messages[i];

    const messageDate = message.created_at.toDateString();

    const prevMessageDate = previousMessage
      ? previousMessage.created_at.toDateString()
      : messageDate;

    if (i === 0 || messageDate !== prevMessageDate) {
      dateSeparators[message.id] = message.created_at;
    }
  }

  return dateSeparators;
};
