import { getGroupStyles } from '../utils/getGroupStyles';
import { getReadStates } from '../utils/getReadStates';
import { insertDates } from '../utils/insertDates';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';

export const useMessageList = ({ noGroupByUser, threadList }) => {
  const { read } = useChannelContext();
  const { messages } = useMessagesContext;
  const { threadMessages } = useThreadContext();

  const messageList = threadList ? threadMessages : messages;
  const readList = threadList ? {} : read;

  const messagesWithDates = insertDates(messageList);
  const messageGroupStyles = getGroupStyles({
    messagesWithDates,
    noGroupByUser,
  });
  const readData = getReadStates(messagesWithDates, readList);

  return messagesWithDates
    .map((msg) => ({
      ...msg,
      groupStyles: messageGroupStyles[msg.id],
      readBy: readData[msg.id] || [],
    }))
    .reverse();
};
