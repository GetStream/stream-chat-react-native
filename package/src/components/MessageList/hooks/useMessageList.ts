import { useEffect, useMemo } from 'react';

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

  const processedMessageList = useMemo(() => {
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
    return messageList
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
      }))
      .reverse() as MessageType[];
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

  useEffect(() => {
    console.log('PROCESSED LIST CHANGED', processedMessageList);
  }, [processedMessageList]);

  return {
    /** Messages enriched with dates/readby/groups and also reversed in order */
    processedMessageList,
    /** Raw messages from the channel state */
    rawMessageList: messageList,
  };
};
