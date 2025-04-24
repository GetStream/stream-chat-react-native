import { useMemo } from 'react';

import type { ChannelState, MessageResponse } from 'stream-chat';

import { useLastReadData } from './useLastReadData';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  DeletedMessagesVisibilityType,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import { getDateSeparators } from '../utils/getDateSeparators';
import { getGroupStyles } from '../utils/getGroupStyles';

export type UseMessageListParams = {
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  noGroupByUser?: boolean;
  threadList?: boolean;
};

export type GroupType = string;

export type MessagesWithStylesReadByAndDateSeparator = MessageResponse & {
  groupStyles: GroupType[];
  readBy: boolean | number;
  dateSeparator?: Date;
};

export type MessageType =
  | ReturnType<ChannelState['formatMessage']>
  | MessagesWithStylesReadByAndDateSeparator;

// Type guards to check MessageType
export const isMessageWithStylesReadByAndDateSeparator = (
  message: MessageType,
): message is MessagesWithStylesReadByAndDateSeparator =>
  (message as MessagesWithStylesReadByAndDateSeparator).readBy !== undefined;

export const shouldIncludeMessageInList = (
  message: MessageType,
  options: { deletedMessagesVisibilityType?: DeletedMessagesVisibilityType; userId?: string },
) => {
  const { deletedMessagesVisibilityType, userId } = options;
  const isMessageTypeDeleted = message.type === 'deleted';
  switch (deletedMessagesVisibilityType) {
    case 'sender':
      return !isMessageTypeDeleted || message.user?.id === userId;

    case 'receiver':
      return !isMessageTypeDeleted || message.user?.id !== userId;

    case 'never':
      return !isMessageTypeDeleted;

    default:
      return !!message;
  }
};

export const useMessageList = (params: UseMessageListParams) => {
  const { noGroupByUser, threadList } = params;
  const { client } = useChatContext();
  const { hideDateSeparators, maxTimeBetweenGroupedMessages, read } = useChannelContext();
  const { deletedMessagesVisibilityType, getMessagesGroupStyles = getGroupStyles } =
    useMessagesContext();
  const { messages } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();

  const messageList = threadList ? threadMessages : messages;
  const readList: ChannelState['read'] | undefined = threadList ? undefined : read;

  const readData = useLastReadData({
    messages: messageList,
    read: readList,
    userID: client.userID,
  });

  const processedMessageList = useMemo<MessageType[]>(() => {
    const dateSeparators = getDateSeparators({
      deletedMessagesVisibilityType,
      hideDateSeparators,
      messages: messageList,
      userId: client.userID,
    });

    const messageGroupStyles = getMessagesGroupStyles({
      dateSeparators,
      hideDateSeparators,
      maxTimeBetweenGroupedMessages,
      messages: messageList,
      noGroupByUser,
      userId: client.userID,
    });

    const newMessageList = [];
    for (const message of messageList) {
      if (
        shouldIncludeMessageInList(message, {
          deletedMessagesVisibilityType,
          userId: client.userID,
        })
      ) {
        const messageId = message.id;
        newMessageList.unshift({
          ...message,
          dateSeparator: dateSeparators[messageId] || undefined,
          groupStyles: messageGroupStyles[messageId] || ['single'],
          readBy: messageId ? readData[messageId] || false : false,
        });
      }
    }
    return newMessageList;
  }, [
    client.userID,
    deletedMessagesVisibilityType,
    getMessagesGroupStyles,
    hideDateSeparators,
    maxTimeBetweenGroupedMessages,
    messageList,
    noGroupByUser,
    readData,
  ]);

  return {
    /** Messages enriched with dates/readby/groups and also reversed in order */
    processedMessageList,
    /** Raw messages from the channel state */
    rawMessageList: messageList,
  };
};
