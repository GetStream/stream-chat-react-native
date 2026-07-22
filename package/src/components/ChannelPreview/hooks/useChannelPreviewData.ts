import { useEffect, useMemo, useState } from 'react';

import throttle from 'lodash/throttle';
import type {
  Channel,
  Event,
  LocalMessage,
  MessagePaginatorAggregateState,
  MessageResponse,
  StreamChat,
} from 'stream-chat';

import { useIsChannelMuted } from './useIsChannelMuted';
import { useIsChannelPinned } from './useIsChannelPinned';

import { useChannelsContext } from '../../../contexts';
import { useStateStore } from '../../../hooks';

const refreshUnreadCountThrottleTimeout = 400;
const refreshUnreadCountThrottleOptions = { leading: true, trailing: true };

export type LastMessageType = LocalMessage | MessageResponse;

// The last message is sourced reactively from the paginator's `aggregateState` — a store kept
// separate from pagination `state` precisely so it stays reactive when a new message lands in the
// head interval while an older window is active (a `state`-derived latest would go stale off-window).
// The preview re-renders whenever the newest message changes (new/edited/deleted) with no manual
// event plumbing.
const lastMessageSelector = (state: MessagePaginatorAggregateState) => ({
  lastMessage: state.lastMessage ?? undefined,
});

export const useChannelPreviewData = (
  channel: Channel,
  client: StreamChat,
  forceUpdateOverride?: number,
) => {
  const [, setForceUpdate] = useState(0);
  const { lastMessage } =
    useStateStore(channel.messagePaginator.aggregateState, lastMessageSelector) ?? {};
  const [unread, setUnread] = useState(channel.countUnread());
  const { muted } = useIsChannelMuted(channel);
  const pinned = useIsChannelPinned(channel);
  const { forceUpdate: contextForceUpdate } = useChannelsContext();
  const channelListForceUpdate = forceUpdateOverride ?? contextForceUpdate;

  const refreshUnreadCount = useMemo(
    () =>
      throttle(
        () => {
          if (muted) {
            setUnread(0);
          } else {
            setUnread(channel.countUnread());
          }
        },
        refreshUnreadCountThrottleTimeout,
        refreshUnreadCountThrottleOptions,
      ),
    [channel, muted],
  );

  useEffect(() => {
    const unsubscribe = channel.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [channel.messageComposer]);

  useEffect(() => {
    const { unsubscribe } = client.on('notification.mark_read', () => {
      refreshUnreadCount();
    });
    return unsubscribe;
  }, [client, refreshUnreadCount]);

  /**
   * This effect listens for the `notification.mark_read` event and sets the unread count to 0
   */
  useEffect(() => {
    const handleReadEvent = (event: Event) => {
      if (!event.cid) {
        return;
      }
      if (channel.cid !== event.cid) {
        return;
      }
      if (event?.user?.id === client.userID) {
        setUnread(0);
      } else if (event?.user?.id) {
        setForceUpdate((prev) => prev + 1);
      }
    };
    const readSubscription = client.on('message.read', handleReadEvent);
    // `message.read_locally` is the client-only equivalent emitted by `channel.markReadLocally()` when
    // read events are disabled (e.g. livestreams with `isLocalUnreadCountEnabled`).
    const localReadSubscription = client.on('message.read_locally', handleReadEvent);
    return () => {
      readSubscription.unsubscribe();
      localReadSubscription.unsubscribe();
    };
  }, [client, channel]);

  /**
   * This effect listens for the `notification.mark_unread` event and updates the unread count
   */
  useEffect(() => {
    const handleUnreadEvent = (event: Event) => {
      if (!event.cid) {
        return;
      }
      if (channel.cid !== event.cid) {
        return;
      }
      if (event.user?.id !== client.user?.id) {
        return;
      }
      setUnread(channel.countUnread());
    };
    const { unsubscribe } = client.on('notification.mark_unread', handleUnreadEvent);
    return unsubscribe;
  }, [client, channel]);

  /**
   * Keep the unread count in sync with events that can change it. The last message itself is sourced
   * reactively from the paginator (see `lastMessageSelector`), so these listeners only refresh unread.
   */
  useEffect(() => {
    refreshUnreadCount();

    const handleEvent = () => {
      refreshUnreadCount();
    };

    const listeners = [
      channel.on('message.new', handleEvent),
      channel.on('message.undeleted', handleEvent),
      channel.on('channel.truncated', handleEvent),
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [channel, refreshUnreadCount, channelListForceUpdate]);

  return { lastMessage, muted, pinned, unread };
};
