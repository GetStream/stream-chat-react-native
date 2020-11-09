import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';
import {
  insertDates,
  InsertDatesResponse,
  isDateSeparator,
} from '../utils/insertDates';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
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

export type UseMessageListParams = {
  noGroupByUser?: boolean;
  threadList?: boolean;
};

export const useMessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  params: UseMessageListParams,
): InsertDatesResponse<At, Ch, Co, Ev, Me, Re, Us> => {
  const { noGroupByUser, threadList } = params;
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
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
    client.userID,
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
          ? readData[msg.id] || false
          : false,
    }))
    .reverse();
};
