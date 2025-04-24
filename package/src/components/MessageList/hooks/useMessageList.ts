import { useMemo } from 'react';

import type { LocalMessage } from 'stream-chat';

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

export const shouldIncludeMessageInList = (
  message: LocalMessage,
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
  const { hideDateSeparators, maxTimeBetweenGroupedMessages } = useChannelContext();
  const { deletedMessagesVisibilityType, getMessagesGroupStyles = getGroupStyles } =
    useMessagesContext();
  const { messages } = usePaginatedMessageListContext();
  const { threadMessages } = useThreadContext();

  const messageList = threadList ? threadMessages : messages;

  const dateSeparators = useMemo(
    () =>
      getDateSeparators({
        deletedMessagesVisibilityType,
        hideDateSeparators,
        messages: messageList,
        userId: client.userID,
      }),
    [deletedMessagesVisibilityType, hideDateSeparators, messageList, client.userID],
  );

  const messageGroupStyles = useMemo(
    () =>
      getMessagesGroupStyles({
        dateSeparators,
        hideDateSeparators,
        maxTimeBetweenGroupedMessages,
        messages: messageList,
        noGroupByUser,
        userId: client.userID,
      }),
    [
      getMessagesGroupStyles,
      dateSeparators,
      hideDateSeparators,
      maxTimeBetweenGroupedMessages,
      messageList,
      noGroupByUser,
      client.userID,
    ],
  );

  const processedMessageList = useMemo<LocalMessage[]>(() => {
    const newMessageList = [];
    for (const message of messageList) {
      if (
        shouldIncludeMessageInList(message, {
          deletedMessagesVisibilityType,
          userId: client.userID,
        })
      ) {
        newMessageList.unshift(message);
      }
    }
    return newMessageList;
  }, [client.userID, deletedMessagesVisibilityType, messageList]);

  return {
    /** Date separators */
    dateSeparators,
    /** Message group styles */
    messageGroupStyles,
    /** Messages enriched with dates/readby/groups and also reversed in order */
    processedMessageList,
    /** Raw messages from the channel state */
    rawMessageList: messageList,
  };
};
