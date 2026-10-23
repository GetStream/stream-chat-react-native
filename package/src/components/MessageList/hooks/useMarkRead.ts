import type { Channel } from 'stream-chat';

import { nowNs } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStableCallback } from '../../../hooks';
import { MarkReadFunctionOptions } from '../../Channel/Channel';

/**
 * Returns a stable `markRead` callback for the channel.
 *
 * The callback reports the read through `client.messageDeliveryReporter.throttledMarkRead`, then
 * resets the paginator's unread snapshot unless `updateChannelUnreadState` is `false`. It does
 * nothing when the channel is missing or pending disposal. When read events are disabled it only
 * calls `channel.markReadLocally()`, and only if `localUnreadCountEnabled` is set.
 *
 * @param channel The channel to mark as read.
 * @returns The `markRead` callback. `options.updateChannelUnreadState` defaults to true.
 */
export const useMarkRead = (channel: Channel) => {
  const { client } = useChatContext();

  // The resolved config, not the raw server flag: `readEvents.enabled` is the channel type's
  // `read_events` ANDed with `client.config.set({ channel: { readEvents } })`. Read at call time
  // because `markRead` is imperative; the try/catch covers a channel pending disposal, which makes
  // the client throw.
  const getReadEventsEnabledSafely = () => {
    try {
      return channel?.config.readEvents.enabled;
    } catch (_) {
      return null;
    }
  };

  const markRead = useStableCallback((options?: MarkReadFunctionOptions) => {
    if (!channel || channel?.pendingDisposal) {
      return;
    }

    // Read events disabled (such as livestreams): reset a local unread count, if enabled, without a
    // backend call. This dispatches `message.read_locally`, which updates the paginator's snapshot.
    if (!getReadEventsEnabledSafely()) {
      if (channel.config.readEvents.localUnreadCountEnabled) {
        channel.markReadLocally();
      }
      return;
    }

    // The reporter throttles and coordinates `/read` calls and honors a custom `markReadRequest`
    // handler registered through `client.config.set({ channel: { requestHandlers } })`.
    client.messageDeliveryReporter.throttledMarkRead(channel);

    // Reset the paginator's unread snapshot so the "N new messages" banner and the unread separator
    // clear once caught up. The client bumps `unreadCount` on every `message.new` but never clears
    // it on `message.read`, and `throttledMarkRead` returns no response, so the boundary advances
    // to the latest message.
    //
    // The mark-read-on-mount call passes `updateChannelUnreadState: false`, so a channel opened
    // with unreads keeps its unread separator until the user catches up.
    const { updateChannelUnreadState = true } = options ?? {};
    if (updateChannelUnreadState) {
      const { latestMessage, latestMessageAt, unreadStateSnapshot } = channel.messagePaginator;
      const previous = unreadStateSnapshot.getLatestValue();
      unreadStateSnapshot.next({
        firstUnreadMessageId: null,
        lastReadAt: latestMessageAt ?? nowNs(),
        lastReadMessageId: latestMessage?.id ?? previous.lastReadMessageId,
        unreadCount: 0,
      });
    }
  });

  return markRead;
};
