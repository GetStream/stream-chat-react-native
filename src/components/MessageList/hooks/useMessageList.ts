import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import {
  MessageWithDates,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import type { ChannelState } from 'stream-chat';

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
  inverted?: boolean;
  noGroupByUser?: boolean;
  threadList?: boolean;
};

export type MessageType<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
  | MessageWithDates<At, Ch, Co, Me, Re, Us>;

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
) => {
  const { inverted, noGroupByUser, threadList } = params;
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { read } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { messages } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { threadMessages } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  const messageList = threadList ? threadMessages : messages;
  const readList:
    | ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']
    | undefined = threadList ? undefined : read;
  const messageGroupStyles = getGroupStyles<At, Ch, Co, Ev, Me, Re, Us>({
    messages: messageList,
    noGroupByUser,
  });

  const readData = getReadStates<At, Ch, Co, Ev, Me, Re, Us>(
    client.userID,
    messageList,
    readList,
  );
  const messagesWithStylesAndRead = messageList
    .filter((msg) => !msg.deleted_at || msg.user?.id === client.userID)
    .map((msg) => ({
      ...msg,
      groupStyles: messageGroupStyles[msg.id] || [],
      readBy: msg.id ? readData[msg.id] || false : false,
    }));

  return (inverted
    ? messagesWithStylesAndRead.reverse()
    : messagesWithStylesAndRead) as MessageType<At, Ch, Co, Ev, Me, Re, Us>[];
};
