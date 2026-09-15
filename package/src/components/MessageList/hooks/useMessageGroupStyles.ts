import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

import { useMessageDateSeparator } from './useMessageDateSeparator';

import { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { getGroupStyle } from '../utils/getGroupStyles';

/**
 * Hook to get the group styles for a message
 */
export const useMessageGroupStyles = (params: {
  noGroupByUser?: boolean;
  getMessageGroupStyle: MessagesContextValue['getMessageGroupStyle'];
  dateSeparatorDate?: Date;
  maxTimeBetweenGroupedMessages?: number;
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
  /**
   * The separator rendered above the next message - it closes the current group. Supplied by the
   * message list when a `getDateSeparators` override resolved it. Omit the key entirely and the
   * hook derives it from `nextMessage`, which is what a standalone caller wants.
   */
  nextMessageDateSeparatorDate?: Date;
}) => {
  const {
    noGroupByUser,
    dateSeparatorDate,
    maxTimeBetweenGroupedMessages,
    message,
    previousMessage,
    nextMessage,
    getMessageGroupStyle = getGroupStyle,
  } = params;

  // presence of the key, not its value, `undefined` is a meaningful resolved answer.
  const isResolvedByCaller = 'nextMessageDateSeparatorDate' in params;
  const derivedNextMessageDateSeparatorDate = useMessageDateSeparator({
    message: nextMessage,
    previousMessage: message,
    skip: isResolvedByCaller,
  });
  const nextMessageDateSeparatorDate = isResolvedByCaller
    ? params.nextMessageDateSeparatorDate
    : derivedNextMessageDateSeparatorDate;

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
