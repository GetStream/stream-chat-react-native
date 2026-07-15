import throttle from 'lodash/throttle';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStableCallback } from '../../../hooks';
import { MarkReadFunctionOptions } from '../../Channel/Channel';

const defaultThrottleInterval = 500;
const throttleOptions = {
  leading: true,
  trailing: true,
};

/**
 * Returns a throttled `markRead` callback for the active channel.
 *
 * The behavior mirrors the previous `Channel`-level implementation: it is a no-op when the channel
 * is missing or disconnected, resets the local unread count when read events are disabled (and the
 * client opted into a local unread count), and otherwise delegates to `channel.markRead()` and then
 * resets the paginator's unread snapshot (unless `updateChannelUnreadState` is `false`).
 * The returned function is stabilized so it can be used as a dependency without triggering rerenders.
 */
export const useMarkRead = (channel: Channel) => {
  const { client } = useChatContext();

  // In case the channel is disconnected which may happen when channel is deleted,
  // underlying js client throws an error. Following function ensures that we don't
  // result in an error in such a case.
  const getChannelConfigSafely = () => {
    try {
      return channel?.getConfig();
    } catch (_) {
      return null;
    }
  };

  const clientChannelConfig = getChannelConfigSafely();

  const markReadInternal = throttle(
    async (options?: MarkReadFunctionOptions) => {
      if (!channel || channel?.disconnected) {
        return;
      }

      // Read events disabled (e.g. livestreams): if the client opted into a local unread count,
      // reset it locally (dispatches message.read_locally) — no backend round trip. The paginator's
      // unread snapshot updates from that.
      if (!clientChannelConfig?.read_events) {
        if (client.options.isLocalUnreadCountEnabled) {
          channel.markReadLocally();
        }
        return;
      }

      // channel.markRead() delegates to client.messageDeliveryReporter.markRead(this), which honors
      // any custom markReadRequest handler registered in channel.configState (see
      // useChannelRequestHandlers).
      try {
        const response = await channel.markRead();

        // Reset the paginator's unread snapshot so the "N new messages" banner and the unread
        // separator clear once the channel is caught up. The LLC bumps `unreadCount` on every
        // incoming `message.new` but never clears it on `message.read`, so without this the banner
        // latches on and can't be dismissed. Mirrors stream-chat-react's `markChannelRead`.
        //
        // Gated on `updateChannelUnreadState` (default true): the mark-read-on-mount call passes
        // `false` so opening a channel with unreads keeps its original unread UI (separator frozen
        // at the boundary) until the user actually catches up.
        const { updateChannelUnreadState = true } = options ?? {};
        if (updateChannelUnreadState && response?.event) {
          channel.messagePaginator.unreadStateSnapshot.next({
            firstUnreadMessageId: null,
            lastReadAt: new Date(),
            lastReadMessageId: response.event.last_read_message_id ?? null,
            unreadCount: 0,
          });
        }
      } catch (err) {
        console.log('Error marking channel as read:', err);
      }
    },
    defaultThrottleInterval,
    throttleOptions,
  );

  const markRead: (options?: MarkReadFunctionOptions) => void = useStableCallback(markReadInternal);

  return markRead;
};
