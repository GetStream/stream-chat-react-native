import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';
import {
  insertDates,
  InsertDatesResponse,
  isDateSeparator,
  MessageOrDate,
} from '../utils/insertDates';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

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

export type MessageList<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageOrDate<At, Ch, Co, Ev, Me, Re, Us>;

export const useMessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  noGroupByUser,
  threadList,
}: {
  noGroupByUser?: boolean;
  threadList?: boolean;
}): InsertDatesResponse<At, Ch, Co, Ev, Me, Re, Us> => {
  const { read } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { messages } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { threadMessages } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  const messageList = threadList ? threadMessages : messages;
  const readList:
    | ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']
    | undefined = threadList ? undefined : read;

  const messagesWithDates = insertDates<At, Ch, Co, Ev, Me, Re, Us>(
    messageList,
  );
  const messageGroupStyles = getGroupStyles<At, Ch, Co, Ev, Me, Re, Us>({
    messagesWithDates,
    noGroupByUser,
  });
  const readData = getReadStates<At, Ch, Co, Ev, Me, Re, Us>(
    messagesWithDates,
    readList,
  );

  return messagesWithDates
    .map((msg) => ({
      ...msg,
      groupStyles:
        !isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(msg) && msg.id
          ? messageGroupStyles[msg.id] || []
          : [],
      readBy:
        !isDateSeparator<At, Ch, Co, Ev, Me, Re, Us>(msg) && msg.id
          ? readData[msg.id] || []
          : [],
    }))
    .reverse();
};
