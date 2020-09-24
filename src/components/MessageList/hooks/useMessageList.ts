import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';
import {
  InsertDate,
  insertDates,
  InsertDatesResponse,
  isDateSeparator,
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
} from '../../../types/types';

export type MessageList<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = InsertDate<At, Ch, Co, Ev, Me, Re, Us>;

export const useMessageList = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
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
