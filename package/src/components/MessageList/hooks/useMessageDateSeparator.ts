import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';
import { nsToDate } from 'stream-chat';

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

  // Nullish rather than truthy: `0` is a legitimate wire timestamp (the epoch), and treating it as
  // "no date" would collapse the grouping key and suppress the separator.
  const previousMessageDate =
    previousMessage?.created_at != null
      ? nsToDate(previousMessage.created_at).toDateString()
      : undefined;
  const messageDate =
    message?.created_at != null ? nsToDate(message.created_at).toDateString() : undefined;

  if (previousMessageDate !== messageDate) {
    // A `Date`, because the separator components that render this are presentational and keep their
    // `date?: Date` props. Converted once, here, where core data leaves the message.
    return message?.created_at != null ? nsToDate(message.created_at) : undefined;
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
}: {
  hideDateSeparators?: boolean;
  message?: LocalMessage;
  previousMessage?: LocalMessage;
}) => {
  const dateSeparatorDate = useMemo(() => {
    if (!message && !previousMessage) {
      return undefined;
    }
    return getDateSeparatorValue({
      hideDateSeparators,
      message,
      previousMessage,
    });
  }, [hideDateSeparators, message, previousMessage]);

  return dateSeparatorDate;
};
