import { useCallback } from 'react';

import { useMessagePaginator } from './useMessagePaginator';
import { useStateStore } from './useStateStore';

type MessageFocusSignalState = { signal: { messageId?: string } | null };

/**
 * Whether the message is the target of the active paginator's `messageFocusSignal` (set by
 * `jumpToMessage` and `jumpToTheFirstUnreadMessage`, for the signal's TTL).
 *
 * Each row selects its own boolean, so a jump re-renders only the row losing the highlight and the
 * row gaining it, not every row as a shared context value would.
 *
 * @param messageId The ID of the message.
 * @returns True when the message is the focus target.
 */
export const useIsTargetedMessage = (messageId: string) => {
  const paginator = useMessagePaginator();

  const selector = useCallback(
    (state: MessageFocusSignalState) => ({
      isTargetedMessage: state.signal?.messageId === messageId,
    }),
    [messageId],
  );

  return !!useStateStore(paginator?.messageFocusSignal, selector)?.isTargetedMessage;
};
