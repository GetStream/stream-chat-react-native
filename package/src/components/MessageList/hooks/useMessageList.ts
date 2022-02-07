import type { ChannelState, ExtendableGenerics, MessageResponse } from 'stream-chat';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { getDateSeparators } from '../utils/getDateSeparators';
import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';

export type UseMessageListParams = {
  deletedMessagesVisibilityType?: 'always' | 'never' | 'receiver' | 'sender';
  inverted?: boolean;
  noGroupByUser?: boolean;
  threadList?: boolean;
};

export type GroupType = 'bottom' | 'middle' | 'single' | 'top';

export type MessagesWithStylesReadByAndDateSeparator<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = MessageResponse<StreamChatClient> & {
  groupStyles: GroupType[];
  readBy: boolean | number;
  dateSeparator?: Date;
};

export type MessageType<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> =
  | ReturnType<ChannelState<StreamChatClient>['formatMessage']>
  | MessagesWithStylesReadByAndDateSeparator<StreamChatClient>;

// Type guards to check MessageType
export const isMessageWithStylesReadByAndDateSeparator = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatClient>,
): message is MessagesWithStylesReadByAndDateSeparator<StreamChatClient> =>
  (message as MessagesWithStylesReadByAndDateSeparator<StreamChatClient>).readBy !== undefined;

export const useMessageList = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  params: UseMessageListParams,
) => {
  const { deletedMessagesVisibilityType, inverted, noGroupByUser, threadList } = params;
  const { client } = useChatContext<StreamChatClient>();
  const { hideDateSeparators, maxTimeBetweenGroupedMessages, read } =
    useChannelContext<StreamChatClient>();
  const { messages } = usePaginatedMessageListContext<StreamChatClient>();
  const { threadMessages } = useThreadContext<StreamChatClient>();

  const messageList = threadList ? threadMessages : messages;
  const readList: ChannelContextValue<StreamChatClient>['read'] | undefined = threadList
    ? undefined
    : read;

  const dateSeparators = getDateSeparators<StreamChatClient>({
    hideDateSeparators,
    messages: messageList,
    userId: client.userID,
  });

  const messageGroupStyles = getGroupStyles<StreamChatClient>({
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
  ) as MessageType<StreamChatClient>[];
};
