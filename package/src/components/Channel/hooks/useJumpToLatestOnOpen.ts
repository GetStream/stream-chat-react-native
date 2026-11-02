import { useLayoutEffect } from 'react';

import { useChannelContext } from '../../../contexts/channelContext/ChannelContext';
import { useThreadContext } from '../../../contexts/threadContext/ThreadContext';
import { useMessagePaginator } from '../../../hooks/useMessagePaginator';

/**
 * Shows the newest messages when a channel or thread is opened on an older page. Its paginator
 * outlives the screen, so it keeps the page it was left on, such as one after a jump to a quoted,
 * pinned or searched message. Runs before the first paint, so the old page never flashes.
 *
 * Stays out of the way of a jump that already landed or is in flight (a deep link from the screen)
 * and of the jump to the first unread message. Runs once per channel or thread: its dependencies
 * are stable, so nothing that changes while it is open moves the list.
 *
 * `<Channel>` and `<Thread>` already run it, unless `<Channel initializeOnMount={false}>`. Call it
 * from a component inside `<Channel>` or `<Thread>` only when the app opted out that way and still
 * wants the newest messages shown on open.
 */
export const useJumpToLatestOnOpen = () => {
  const { channel, hasPendingInitialTargetLoad } = useChannelContext();
  const { thread } = useThreadContext();
  const paginator = useMessagePaginator();

  useLayoutEffect(() => {
    // A channel that is not loaded yet, or a draft, gets its first page from `<Channel>` itself.
    const isChannelLoading = !thread && (!channel.initialized || channel.isProvisional);
    if (
      isChannelLoading ||
      !paginator.items?.length ||
      paginator.isActiveIntervalAtHead ||
      paginator.isLoading ||
      hasPendingInitialTargetLoad?.()
    ) {
      return;
    }

    paginator
      .jumpToTheLatestMessage()
      .catch((error: unknown) => console.warn('Jumping to the latest message failed:', error));
  }, [channel, hasPendingInitialTargetLoad, paginator, thread]);
};
