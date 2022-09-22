import type { ChannelState, MessageResponse } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  DeletedMessagesVisibilityType,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { getDateSeparators } from '../utils/getDateSeparators';
import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';

export type UseMessageListParams = {
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  inverted?: boolean;
  noGroupByUser?: boolean;
  threadList?: boolean;
};

export type GroupType = 'bottom' | 'middle' | 'single' | 'top';

export type MessagesWithStylesReadByAndDateSeparator<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = MessageResponse<StreamChatGenerics> & {
  groupStyles: GroupType[];
  readBy: boolean | number;
  dateSeparator?: Date;
};

export type MessageType<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> =
  | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
  | MessagesWithStylesReadByAndDateSeparator<StreamChatGenerics>;

// Type guards to check MessageType
export const isMessageWithStylesReadByAndDateSeparator = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics>,
): message is MessagesWithStylesReadByAndDateSeparator<StreamChatGenerics> =>
  (message as MessagesWithStylesReadByAndDateSeparator<StreamChatGenerics>).readBy !== undefined;

export const useMessageList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  params: UseMessageListParams,
) => {
  const { inverted, noGroupByUser, threadList } = params;
  const { client } = useChatContext<StreamChatGenerics>();
  const { hideDateSeparators, maxTimeBetweenGroupedMessages, read } =
    useChannelContext<StreamChatGenerics>();
  const { deletedMessagesVisibilityType } = useMessagesContext<StreamChatGenerics>();
  const { messages } = usePaginatedMessageListContext<StreamChatGenerics>();
  const { threadMessages } = useThreadContext<StreamChatGenerics>();

  const messageList = threadList ? threadMessages : messages;
  const readList: ChannelContextValue<StreamChatGenerics>['read'] | undefined = threadList
    ? undefined
    : read;

  const dateSeparators = getDateSeparators<StreamChatGenerics>({
    deletedMessagesVisibilityType,
    hideDateSeparators,
    messages: messageList,
    userId: client.userID,
  });

  const messageGroupStyles = getGroupStyles<StreamChatGenerics>({
    dateSeparators,
    hideDateSeparators,
    maxTimeBetweenGroupedMessages,
    messages: messageList,
    noGroupByUser,
    userId: client.userID,
  });

  const readData = getReadStates(client.userID, messageList, readList);

  const messagesWithStylesReadByAndDateSeparator = messageList
    .filter((msg) => {
      const isMessageTypeDeleted = msg.type === 'deleted';
      if (deletedMessagesVisibilityType === 'sender') {
        return !isMessageTypeDeleted || msg.user?.id === client.userID;
      } else if (deletedMessagesVisibilityType === 'receiver') {
        return !isMessageTypeDeleted || msg.user?.id !== client.userID;
      } else if (deletedMessagesVisibilityType === 'never') {
        return !isMessageTypeDeleted;
      } else {
        return msg;
      }
    })
    .map((msg) => ({
      ...msg,
      dateSeparator: dateSeparators[msg.id] || undefined,
      groupStyles: messageGroupStyles[msg.id] || ['single'],
      readBy: msg.id ? readData[msg.id] || false : false,
    }));

  return (
    inverted
      ? messagesWithStylesReadByAndDateSeparator.reverse()
      : messagesWithStylesReadByAndDateSeparator
  ) as MessageType<StreamChatGenerics>[];
};
