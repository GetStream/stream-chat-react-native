import type { ExtendableGenerics } from 'stream-chat';

import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type GetDateSeparatorsParams<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
  messages:
    | PaginatedMessageListContextValue<StreamChatClient>['messages']
    | ThreadContextValue<StreamChatClient>['threadMessages'];
  hideDateSeparators?: boolean;
  userId?: string;
};

export type DateSeparators = {
  [key: string]: Date;
};

export const getDateSeparators = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  params: GetDateSeparatorsParams<StreamChatClient>,
) => {
  const { hideDateSeparators, messages, userId } = params;
  const dateSeparators: DateSeparators = {};

  if (hideDateSeparators) {
    return dateSeparators;
  }

  const messagesWithoutDeleted = messages.filter((message) => {
    const isMessageTypeDeleted = message.type === 'deleted';
    return !isMessageTypeDeleted || userId === message.user?.id;
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
