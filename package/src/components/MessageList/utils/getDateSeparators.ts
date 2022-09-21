import type { DeletedMessagesVisibilityType } from '../../../contexts/messagesContext/MessagesContext';
import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type GetDateSeparatorsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  messages:
    | PaginatedMessageListContextValue<StreamChatGenerics>['messages']
    | ThreadContextValue<StreamChatGenerics>['threadMessages'];
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  hideDateSeparators?: boolean;
  userId?: string;
};

export type DateSeparators = {
  [key: string]: Date;
};

export const getDateSeparators = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  params: GetDateSeparatorsParams<StreamChatGenerics>,
) => {
  const { deletedMessagesVisibilityType, hideDateSeparators, messages, userId } = params;
  const dateSeparators: DateSeparators = {};

  if (hideDateSeparators) {
    return dateSeparators;
  }

  const messagesWithoutDeleted = messages.filter((message) => {
    const isMessageTypeDeleted = message.type === 'deleted';

    const isDeletedMessageVisibleToSender =
      deletedMessagesVisibilityType === 'sender' || deletedMessagesVisibilityType === 'always';

    return (
      !isMessageTypeDeleted || (userId === message.user?.id && isDeletedMessageVisibleToSender)
    );
  });

  for (let i = 0; i < messagesWithoutDeleted.length; i++) {
    const previousMessage = messagesWithoutDeleted[i - 1];
    const message = messagesWithoutDeleted[i];

    const messageDate = message.created_at.getDay();

    const prevMessageDate = previousMessage ? previousMessage.created_at.getDay() : messageDate;

    if (i === 0 || messageDate !== prevMessageDate) {
      dateSeparators[message.id] = message.created_at;
    }
  }

  return dateSeparators;
};
