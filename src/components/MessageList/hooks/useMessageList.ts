import { getDateSeparators } from '../utils/getDateSeparators';
import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import type { ChannelState, MessageResponse } from 'stream-chat';

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

export type GroupType = 'bottom' | 'middle' | 'single' | 'top';

export type MessagesWithStylesReadByAndDateSeparator<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageResponse<At, Ch, Co, Me, Re, Us> & {
  groupStyles: GroupType[];
  readBy: boolean | number;
  dateSeparator?: Date;
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
  | MessagesWithStylesReadByAndDateSeparator<At, Ch, Co, Me, Re, Us>;

// Type guards to check MessageType
export const isMessagesWithStylesReadByAndDateSeparator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
): message is MessagesWithStylesReadByAndDateSeparator<
  At,
  Ch,
  Co,
  Me,
  Re,
  Us
> =>
  (message as MessagesWithStylesReadByAndDateSeparator<At, Ch, Co, Me, Re, Us>)
    .readBy !== undefined;

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
  const { hideDateSeparators, read } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { messages } = usePaginatedMessageListContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { threadMessages } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

  const messageList = threadList ? threadMessages : messages;
  const readList:
    | ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['read']
    | undefined = threadList ? undefined : read;

  const dateSeparators = getDateSeparators<At, Ch, Co, Ev, Me, Re, Us>({
    hideDateSeparators,
    messages: messageList,
  });

  const messageGroupStyles = getGroupStyles<At, Ch, Co, Ev, Me, Re, Us>({
    dateSeparators,
    hideDateSeparators,
    messages: messageList,
    noGroupByUser,
  });

  const readData = getReadStates(client.userID, messageList, readList);

  const messagesWithStylesReadByAndDateSeparator = messageList
    .filter((msg) => !msg.deleted_at || msg.user?.id === client.userID)
    .map((msg) => ({
      ...msg,
      dateSeparator: dateSeparators[msg.id] || undefined,
      groupStyles: messageGroupStyles[msg.id] || [],
      readBy: msg.id ? readData[msg.id] || false : false,
    }));

  return (inverted
    ? messagesWithStylesReadByAndDateSeparator.reverse()
    : messagesWithStylesReadByAndDateSeparator) as MessageType<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >[];
};
