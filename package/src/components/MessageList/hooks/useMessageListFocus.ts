import { useEffect } from 'react';

import type { MessagePaginator } from 'stream-chat';

import { useStableCallback, useStateStore } from '../../../hooks';

/** How long, in milliseconds, a message the list jumped to stays highlighted. */
export const DEFAULT_HIGHLIGHT_DURATION = 3000;

const messageFocusSelector = (state: {
  signal: { messageId?: string; token?: number } | null;
}) => ({
  focusedMessageId: state.signal?.messageId,
  focusToken: state.signal?.token,
});

/**
 * Tracks the message the list should scroll to and highlight, from the paginator's
 * `messageFocusSignal`. A jump (`jumpToMessage`, `jumpToTheFirstUnreadMessage`, ...) emits the
 * signal, and `focusToken` changes on every jump, even to the same message.
 *
 * The paginator outlives the list, so the signal is cleared on unmount. Otherwise a highlight
 * still running when the user navigates away would scroll and highlight again on return.
 *
 * @param paginator The channel's or the open thread's paginator.
 * @returns `focusedMessageId`, `focusToken` and `goToMessage`, which jumps to a message by ID.
 */
export const useMessageListFocus = (paginator?: MessagePaginator) => {
  const { focusedMessageId, focusToken } =
    useStateStore(paginator?.messageFocusSignal, messageFocusSelector) ?? {};

  useEffect(() => () => paginator?.clearMessageFocusSignal(), [paginator]);

  const goToMessage = useStableCallback(async (messageId: string) => {
    await paginator?.jumpToMessage(messageId, {
      focusReason: 'jump-to-message',
      focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
    });
  });

  return { focusedMessageId, focusToken, goToMessage };
};
