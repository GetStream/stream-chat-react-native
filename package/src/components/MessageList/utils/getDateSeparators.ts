import type { DeletedMessagesVisibilityType } from '../../../contexts/messagesContext/MessagesContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';

export type GetDateSeparatorsParams = {
  messages: PaginatedMessageListContextValue['messages'] | ThreadContextValue['threadMessages'];
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  hideDateSeparators?: boolean;
  userId?: string;
};

export type DateSeparators = {
  [key: string]: Date;
};

export const getDateSeparators = (params: GetDateSeparatorsParams) => {
  const { deletedMessagesVisibilityType, hideDateSeparators, messages, userId } = params;
  const dateSeparators: DateSeparators = {};

  if (hideDateSeparators) {
    return dateSeparators;
  }

  const messagesWithoutDeleted = messages.filter((message) => {
    const isMessageTypeDeleted = message.type === 'deleted';

    const isDeletedMessageVisibleToSender =
      deletedMessagesVisibilityType === 'sender' || deletedMessagesVisibilityType === 'always';

    const isDeletedMessageVisibleToReceiver =
      deletedMessagesVisibilityType === 'receiver' || deletedMessagesVisibilityType === 'always';

    return (
      !isMessageTypeDeleted ||
      (userId === message.user?.id && isDeletedMessageVisibleToSender) ||
      (userId !== message.user?.id && isDeletedMessageVisibleToReceiver)
    );
  });

  for (let i = 0; i < messagesWithoutDeleted.length; i++) {
    const previousMessage = messagesWithoutDeleted[i - 1];
    const message = messagesWithoutDeleted[i];

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
