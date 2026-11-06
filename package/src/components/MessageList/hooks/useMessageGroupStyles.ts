import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

import { useMessageDateSeparator } from './useMessageDateSeparator';

import { MessagesContextValue } from '../../../contexts/messagesContext/MessagesContext';
import { getGroupStyle } from '../utils/getGroupStyles';

/**
 * Returns the group styles of a message, computed by `getMessageGroupStyle`.
 *
 * @param params.noGroupByUser Skips grouping, which yields an empty array.
 * @param params.dateSeparatorDate Date of the separator above the message, if any.
 * @param params.maxTimeBetweenGroupedMessages Longest gap, in milliseconds, within a group.
 * @param params.message The message to style.
 * @param params.previousMessage The message rendered before it.
 * @param params.nextMessage The message rendered after it.
 * @param params.getMessageGroupStyle Computes the group styles. Defaults to `getGroupStyle`.
 * @returns The group styles.
 */
export const useMessageGroupStyles = ({
  noGroupByUser,
  dateSeparatorDate,
  maxTimeBetweenGroupedMessages,
  message,
  previousMessage,
  nextMessage,
  getMessageGroupStyle = getGroupStyle,
}: {
  noGroupByUser?: boolean;
  getMessageGroupStyle: MessagesContextValue['getMessageGroupStyle'];
  dateSeparatorDate?: Date;
  maxTimeBetweenGroupedMessages?: number;
  message: LocalMessage;
  previousMessage?: LocalMessage;
  nextMessage?: LocalMessage;
}) => {
  // The next message's separator feeds into this message's group style.
  const nextMessageDateSeparatorDate = useMessageDateSeparator({
    message: nextMessage,
    previousMessage: message,
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
