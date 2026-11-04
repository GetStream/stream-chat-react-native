import { useEffect } from 'react';

import type { MessagePaginator } from 'stream-chat';

import type { GoToMessage } from '../../../contexts/messageListItemContext/MessageListItemContext';
import { useMessagesContext } from '../../../contexts/messagesContext/MessagesContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useStableCallback, useStateStore } from '../../../hooks';
import { useOpenThreadAtMessage } from '../../Message/hooks/useOpenThreadAtMessage';

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
 * @returns `focusedMessageId`, `focusToken` and `goToMessage`, which jumps to a message by ID. A
 * message passed along that is a reply living only in another thread is not in this list, so its
 * thread is opened at it instead (through `onAlsoSentToChannelHeaderPress`, when set).
 */
export const useMessageListFocus = (paginator?: MessagePaginator) => {
  const { focusedMessageId, focusToken } =
    useStateStore(paginator?.messageFocusSignal, messageFocusSelector) ?? {};

  useEffect(() => () => paginator?.clearMessageFocusSignal(), [paginator]);

  const { onAlsoSentToChannelHeaderPress } = useMessagesContext();
  const { thread } = useThreadContext();
  const openThreadAtMessage = useOpenThreadAtMessage();

  const goToMessage: GoToMessage = useStableCallback(async (messageId, message) => {
    const parentId = message?.parent_id;
    if (
      onAlsoSentToChannelHeaderPress &&
      parentId &&
      parentId !== thread?.id &&
      !message.show_in_channel
    ) {
      await openThreadAtMessage({ parentId, targetedMessageId: messageId });
      return;
    }
    await paginator?.jumpToMessage(messageId, {
      focusReason: 'jump-to-message',
      focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
    });
  });

  return { focusedMessageId, focusToken, goToMessage };
};
