import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

/**
 * A comparable key for the calendar day a date falls on. Equivalent to comparing
 * `toDateString()` values, but without formatting a string for every comparison - the message
 * list derives a separator for every loaded message, so this runs once per message per update.
 */
export const getDayKey = (date?: Date) =>
  date ? date.getFullYear() * 10000 + date.getMonth() * 100 + date.getDate() : undefined;

export const getDateSeparatorValue = ({
  hideDateSeparators,
  message,
  previousMessage,
}: {
  hideDateSeparators?: boolean;
  message?: LocalMessage;
  previousMessage?: LocalMessage;
}) => {
  if (hideDateSeparators) {
    return undefined;
  }

  if (getDayKey(previousMessage?.created_at) !== getDayKey(message?.created_at)) {
    return message?.created_at;
  }

  return undefined;
};

/**
 * Hook to get whether a message should have a date separator above it
 */
export const useMessageDateSeparator = ({
  hideDateSeparators,
  message,
  previousMessage,
  skip,
}: {
  hideDateSeparators?: boolean;
  message?: LocalMessage;
  previousMessage?: LocalMessage;
  /** Set when the message list already resolved the separator, so no work is done here. */
  skip?: boolean;
}) => {
  const dateSeparatorDate = useMemo(() => {
    if (skip || (!message && !previousMessage)) {
      return undefined;
    }
    return getDateSeparatorValue({
      hideDateSeparators,
      message,
      previousMessage,
    });
  }, [skip, hideDateSeparators, message, previousMessage]);

  return dateSeparatorDate;
};
