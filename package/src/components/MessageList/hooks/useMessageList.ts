import { useEffect, useMemo } from 'react';

import type { LocalMessage } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import {
  DeletedMessagesVisibilityType,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { usePaginatedMessageListContext } from '../../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

import { useRAFCoalescedValue } from '../../../hooks';
import { MessagePreviousAndNextMessageStore } from '../../../state-store/message-list-prev-next-state';

export type UseMessageListParams = {
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
  const { threadList, isLiveStreaming, isFlashList } = params;
  const { client } = useChatContext();
  const { deletedMessagesVisibilityType } = useMessagesContext();
  const { messages, viewabilityChangedCallback } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();
  const messageList = threadList ? threadMessages : messages;

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

  const messageListPreviousAndNextMessageStore = useMemo(
    () => new MessagePreviousAndNextMessageStore(),
    [],
  );

  useEffect(() => {
    messageListPreviousAndNextMessageStore.setMessageListPreviousAndNextMessage(
      filteredMessageList,
    );
  }, [filteredMessageList, messageListPreviousAndNextMessageStore]);

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
