import { useEffect, useMemo, useRef, useState } from 'react';

import type { LocalMessage } from 'stream-chat';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  DeletedMessagesVisibilityType,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import { useRAFCoalescedValue } from '../../../hooks';
import { MessagePreviousAndNextMessageStore } from '../../../state-store/message-list-prev-next-state';
import { DateSeparators, getDateSeparators } from '../utils/getDateSeparators';
import { getGroupStyles } from '../utils/getGroupStyles';

export type UseMessageListParams = {
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;
  /**
   * @deprecated
   */
  noGroupByUser?: boolean;
  threadList?: boolean;
  isLiveStreaming?: boolean;
  isFlashList?: boolean;
};

/**
 * FIXME: To change it to a more specific type.
 */
export type GroupType = string;

export type MessageGroupStyles = {
  [key: string]: string[];
};

export const shouldIncludeMessageInList = (
  message: LocalMessage,
  options: { deletedMessagesVisibilityType?: DeletedMessagesVisibilityType; userId?: string },
) => {
  const { deletedMessagesVisibilityType, userId } = options;
  const isMessageTypeDeleted = message.type === 'deleted';
  const isSender = message.user?.id === userId;

  if (!isMessageTypeDeleted) {
    return true;
  }

  switch (deletedMessagesVisibilityType) {
    case 'always':
      return true;
    case 'sender':
      return isSender;
    case 'receiver':
      return !isSender;
    case 'never':
    default:
      return false;
  }
};

export const useMessageList = (params: UseMessageListParams) => {
  const { noGroupByUser, threadList, isLiveStreaming, isFlashList } = params;
  const { client } = useChatContext();
  const { hideDateSeparators, maxTimeBetweenGroupedMessages } = useChannelContext();
  const { deletedMessagesVisibilityType, getMessagesGroupStyles = getGroupStyles } =
    useMessagesContext();
  const { messages, viewabilityChangedCallback } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();
  const messageList = threadList ? threadMessages : messages;
  const [messageListPreviousAndNextMessageStore] = useState(
    () => new MessagePreviousAndNextMessageStore(),
  );

  const filteredMessageList = useMemo(() => {
    const filteredMessages = [];
    for (const message of messageList) {
      if (
        shouldIncludeMessageInList(message, {
          deletedMessagesVisibilityType,
          userId: client.userID,
        })
      ) {
        filteredMessages.push(message);
      }
    }
    return filteredMessages;
  }, [messageList, deletedMessagesVisibilityType, client.userID]);

  useEffect(() => {
    messageListPreviousAndNextMessageStore.setMessageListPreviousAndNextMessage(
      filteredMessageList,
    );
  }, [filteredMessageList, messageListPreviousAndNextMessageStore]);

  /**
   * @deprecated use `useDateSeparator` hook instead directly in the Message.
   */
  const dateSeparators = useMemo(
    () =>
      getDateSeparators({
        hideDateSeparators,
        messages: filteredMessageList,
      }),
    [hideDateSeparators, filteredMessageList],
  );

  /**
   * @deprecated use `useDateSeparator` hook instead directly in the Message.
   */
  const dateSeparatorsRef = useRef<DateSeparators>(dateSeparators);
  dateSeparatorsRef.current = dateSeparators;

  /**
   * @deprecated use `useMessageGroupStyles` hook instead directly in the Message.
   */
  const messageGroupStyles = useMemo(
    () =>
      getMessagesGroupStyles({
        dateSeparators: dateSeparatorsRef.current,
        hideDateSeparators,
        maxTimeBetweenGroupedMessages,
        messages: filteredMessageList,
        noGroupByUser,
        userId: client.userID,
      }),
    [
      getMessagesGroupStyles,
      hideDateSeparators,
      maxTimeBetweenGroupedMessages,
      filteredMessageList,
      noGroupByUser,
      client.userID,
    ],
  );

  /**
   * @deprecated use `useMessageGroupStyles` hook instead directly in the Message.
   */
  const messageGroupStylesRef = useRef<MessageGroupStyles>(messageGroupStyles);
  messageGroupStylesRef.current = messageGroupStyles;

  const processedMessageList = useMemo<LocalMessage[]>(() => {
    const newMessageList = [];
    for (const message of filteredMessageList) {
      if (isFlashList) {
        newMessageList.push(message);
      } else {
        newMessageList.unshift(message);
      }
    }
    return newMessageList;
  }, [filteredMessageList, isFlashList]);

  const data = useRAFCoalescedValue(processedMessageList, isLiveStreaming);

  return useMemo(
    () => ({
      /** Date separators */
      dateSeparatorsRef,
      /** Message group styles */
      messageGroupStylesRef,
      messageListPreviousAndNextMessageStore,
      /** Messages enriched with dates/readby/groups and also reversed in order */
      processedMessageList: data,
      /** Raw messages from the channel state */
      rawMessageList: messageList,
      viewabilityChangedCallback,
    }),
    [data, messageList, messageListPreviousAndNextMessageStore, viewabilityChangedCallback],
  );
};
