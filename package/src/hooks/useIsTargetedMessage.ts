import { useCallback } from 'react';

import { useActiveMessagePaginator } from './useActiveMessagePaginator';
import { useStateStore } from './useStateStore';

type MessageFocusSignalState = { signal: { messageId?: string } | null };

/**
 * Whether this message is the one the list is currently focused on — the target of a
 * `jumpToMessage` / `jumpToTheFirstUnreadMessage`, for the lifetime of the signal's TTL.
 *
 * Read per row, off the active paginator's `messageFocusSignal`, rather than from a
 * `highlightedMessageId` on the channel context. Both cost one subscription per row in practice
 * (every row already consumes that context), but a context value that changes on every jump
 * re-renders every row; a boolean scoped to one id re-renders only the row losing the highlight
 * and the row gaining it.
 */
export const useIsTargetedMessage = (messageId: string) => {
  const paginator = useActiveMessagePaginator();

  const selector = useCallback(
    (state: MessageFocusSignalState) => ({
      isTargetedMessage: state.signal?.messageId === messageId,
    }),
    [messageId],
  );

  return !!useStateStore(paginator?.messageFocusSignal, selector)?.isTargetedMessage;
};
