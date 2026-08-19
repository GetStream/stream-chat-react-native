import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStableCallback } from '../../../hooks';
import { MarkReadFunctionOptions } from '../../Channel/Channel';

/**
 * Returns a `markRead` callback for the active channel.
 *
 * Marks the channel read through the client's `messageDeliveryReporter.throttledMarkRead` — the
 * canonical v10 read-reporting path, which the reporter throttles + coordinates — rather than calling
 * `channel.markRead()` behind our own throttle. It is a no-op when the channel is missing or
 * pending disposal; when read events are disabled it resets the local unread count via `markReadLocally()`
 * (dispatches `message.read_locally`) if the client opted into a local count; otherwise it reports the
 * read and resets the paginator's unread snapshot (unless `updateChannelUnreadState` is `false`) so the
 * "N new messages" banner + unread separator clear once caught up. The returned function is stabilized
 * so it can be used as a dependency without triggering rerenders.
 */
export const useMarkRead = (channel: Channel) => {
  const { client } = useChatContext();

  // In case the channel is pending disposal, which may happen when the channel is deleted,
  // underlying js client throws an error. Following function ensures that we don't
  // result in an error in such a case.
  const getChannelConfigSafely = () => {
    try {
      return channel?.getConfig();
    } catch (_) {
      return null;
    }
  };

  const markRead = useStableCallback((options?: MarkReadFunctionOptions) => {
    if (!channel || channel?.pendingDisposal) {
      return;
    }

    // Read events disabled (e.g. livestreams): if the client opted into a local unread count, reset
    // it locally (dispatches message.read_locally) — no backend round trip. The paginator's unread
    // snapshot updates from that.
    if (!getChannelConfigSafely()?.read_events) {
      if (client.options.isLocalUnreadCountEnabled) {
        channel.markReadLocally();
      }
      return;
    }

    // Canonical v10 read reporting: the reporter throttles + coordinates the `/read` calls and honors
    // any custom markReadRequest handler registered in channel.configState (see
    // useChannelRequestHandlers).
    client.messageDeliveryReporter.throttledMarkRead(channel);

    // Reset the paginator's unread snapshot so the "N new messages" banner and the unread separator
    // clear once the channel is caught up. The LLC bumps `unreadCount` on every incoming
    // `message.new` but never clears it on `message.read`, so without this the banner latches on and
    // can't be dismissed. `throttledMarkRead` is fire-and-forget (no response to read), so advance
    // the boundary to the latest loaded message.
    //
    // Gated on `updateChannelUnreadState` (default true): the mark-read-on-mount call passes `false`
    // so opening a channel with unreads keeps its original unread UI (separator frozen at the
    // boundary) until the user actually catches up.
    const { updateChannelUnreadState = true } = options ?? {};
    if (updateChannelUnreadState) {
      const loadedItems = channel.messagePaginator.state.getLatestValue().items ?? [];
      const previous = channel.messagePaginator.unreadStateSnapshot.getLatestValue();
      channel.messagePaginator.unreadStateSnapshot.next({
        firstUnreadMessageId: null,
        lastReadAt: new Date(),
        lastReadMessageId: loadedItems[loadedItems.length - 1]?.id ?? previous.lastReadMessageId,
        unreadCount: 0,
      });
    }
  });

  return markRead;
};
