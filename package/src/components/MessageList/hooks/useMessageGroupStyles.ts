import { useCallback, useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

import { useMessageDateSeparator } from './useMessageDateSeparator';

import { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { useStateStore } from '../../../hooks/useStateStore';
import {
  MessagePreviousAndNextMessageStore,
  MessagePreviousAndNextMessageStoreType,
} from '../../../state-store/message-list-prev-next-state';
import { getGroupStyle } from '../utils/getGroupStyles';

/**
 * Hook to get the group styles for a message
 */
export const useMessageGroupStyles = ({
  noGroupByUser,
  dateSeparatorDate,
  maxTimeBetweenGroupedMessages,
  message,
  messageListPreviousAndNextMessageStore,
  getMessageGroupStyle = getGroupStyle,
}: {
  noGroupByUser?: boolean;
  getMessageGroupStyle: MessagesContextValue['getMessageGroupStyle'];
  dateSeparatorDate?: Date;
  maxTimeBetweenGroupedMessages?: number;
  message: LocalMessage;
  messageListPreviousAndNextMessageStore: MessagePreviousAndNextMessageStore;
}) => {
  const selector = useCallback(
    (state: MessagePreviousAndNextMessageStoreType) => ({
      nextMessage: state.messageList[message.id]?.nextMessage,
      previousMessage: state.messageList[message.id]?.previousMessage,
    }),
    [message.id],
  );
  const { previousMessage, nextMessage } = useStateStore(
    messageListPreviousAndNextMessageStore.state,
    selector,
  );

  // This is needed to calculate the group styles for the next message
  const nextMessageDateSeparatorDate = useMessageDateSeparator({
    message: nextMessage,
    messageListPreviousAndNextMessageStore,
  });

  const groupStyles = useMemo(() => {
    if (noGroupByUser) {
      return [];
    }
    return getMessageGroupStyle({
      dateSeparatorDate,
      maxTimeBetweenGroupedMessages,
      message,
      nextMessage,
      nextMessageDateSeparatorDate,
      previousMessage,
    });
  }, [
    noGroupByUser,
    getMessageGroupStyle,
    dateSeparatorDate,
    maxTimeBetweenGroupedMessages,
    message,
    nextMessage,
    nextMessageDateSeparatorDate,
    previousMessage,
  ]);

  return groupStyles;
};
