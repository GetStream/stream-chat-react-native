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
 * The behavior mirrors the previous `Channel`-level implementation exactly: it is a no-op when the
 * channel is missing or disconnected, resets the local unread count when read events are disabled
 * (and the client opted into a local unread count), and otherwise delegates to `channel.markRead()`.
 * The returned function is stabilized so it can be used as a dependency without triggering rerenders,
 * and accepts (but ignores) an options argument for backwards compatibility with call sites.
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
    async () => {
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
      // useChannelRequestHandlers). Unread state updates in the LLC snapshot, mirrored into the store.
      try {
        await channel.markRead();
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
