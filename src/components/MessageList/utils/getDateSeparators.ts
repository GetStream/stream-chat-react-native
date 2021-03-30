import type { PaginatedMessageListContextValue } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import type { ThreadContextValue } from '../../../contexts/threadContext/ThreadContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type GetDateSeparatorsParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  messages:
    | PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['messages']
    | ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['threadMessages'];
  hideDateSeparators?: boolean;
};

export type DateSeparators = {
  [key: string]: Date;
};

export const getDateSeparators = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  params: GetDateSeparatorsParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { hideDateSeparators, messages } = params;
  const dateSeparators: DateSeparators = {};

  if (hideDateSeparators) {
    return dateSeparators;
  }

  const messagesWithoutDeletedOrRead = messages.filter(
    (message) => !message.deleted_at && message.type !== 'message.read',
  );

  for (let i = 0; i < messagesWithoutDeletedOrRead.length; i++) {
    const previousMessage = messagesWithoutDeletedOrRead[i - 1];
    const message = messagesWithoutDeletedOrRead[i];

    if (message.type === 'message.read' || message.deleted_at) {
      continue;
    }

    const messageDate = message.created_at.getDay();

    const prevMessageDate = previousMessage
      ? previousMessage.created_at.getDay()
      : messageDate;

    if (i === 0 || messageDate !== prevMessageDate) {
      dateSeparators[message.id] = message.created_at;
    }
  }

  return dateSeparators;
};
