import type { ChannelState } from 'stream-chat';

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

  const readData = useLastReadData({
    messages: messageList,
    read: readList,
    userID: client.userID,
  });

  const messagesWithStyles = messageList.filter((msg) => {
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
  });

  const processedMessageList = [...messagesWithStyles].reverse();

  return {
    /** Date separators */
    dateSeparators,
    /** Message group styles */
    messageGroupStyles,
    /** Messages enriched with dates/readby/groups and also reversed in order */
    processedMessageList,
    /** Raw messages from the channel state */
    rawMessageList: messageList,
    /** Read data */
    readData,
  };
};
