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

  // Nullish check, as `0` is a valid timestamp (the epoch) and must not suppress the separator.
  const previousMessageDate =
    previousMessage?.created_at != null
      ? nsToDate(previousMessage.created_at).toDateString()
      : undefined;
  const messageDate =
    message?.created_at != null ? nsToDate(message.created_at).toDateString() : undefined;

  if (previousMessageDate !== messageDate) {
    // A `Date`, as the presentational separator components take `date?: Date`.
    return message?.created_at != null ? nsToDate(message.created_at) : undefined;
  }

  return undefined;
};

/**
 * Returns the date for a separator above the message, or `undefined` when none is needed.
 *
 * @param params.hideDateSeparators Suppresses every separator.
 * @param params.message The message the separator sits above.
 * @param params.previousMessage The message rendered before it.
 * @returns The message's creation date when it falls on a different day than the previous message.
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
