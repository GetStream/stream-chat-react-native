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
 * The message `paginator` wants the list to scroll to and highlight, and `goToMessage` to request
 * one. A jump (`jumpToMessage`, `jumpToTheFirstUnreadMessage`, …) emits the paginator's
 * `messageFocusSignal`; the list scrolls when it sees a new `focusToken`, which changes on every jump
 * even to the same message.
 *
 * The signal lives on the paginator, which outlives the list, so it is cleared on unmount. Otherwise a
 * highlight still running when the user navigates away would scroll and highlight again on return.
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
