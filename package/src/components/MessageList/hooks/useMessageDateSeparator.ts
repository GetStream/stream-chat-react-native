import { useMemo } from 'react';

import { LocalMessage } from 'stream-chat';

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

  const previousMessageDate = previousMessage?.created_at.toDateString();
  const messageDate = message?.created_at.toDateString();

  if (previousMessageDate !== messageDate) {
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
