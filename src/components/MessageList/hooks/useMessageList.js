import { useContext } from 'react';

import {
  ChannelContext,
  MessagesContext,
  ThreadContext,
} from '../../../context';
import { getGroupStyles, getReadStates, insertDates } from '../utils';

export const useMessageList = ({ noGroupByUser, threadList }) => {
  const { messages } = useContext(MessagesContext);
  const { threadMessages } = useContext(ThreadContext);
  const { read } = useContext(ChannelContext);
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
