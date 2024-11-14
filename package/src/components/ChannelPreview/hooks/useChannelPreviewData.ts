import { useEffect, useMemo, useState } from 'react';

import throttle from 'lodash/throttle';
import type { Channel, ChannelState, Event, MessageResponse, StreamChat } from 'stream-chat';

import { useIsChannelMuted } from './useIsChannelMuted';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelPreviewData = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  client: StreamChat<StreamChatGenerics>,
  forceUpdate?: number,
) => {
  const [lastMessage, setLastMessage] = useState<
    | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
    | MessageResponse<StreamChatGenerics>
  >(channel.state.messages[channel.state.messages.length - 1]);
  const [unread, setUnread] = useState(channel.countUnread());
  const { muted } = useIsChannelMuted(channel);

  /**
   * This effect listens for the `notification.mark_read` event and sets the unread count to 0
   */
  useEffect(() => {
    const handleReadEvent = (event: Event) => {
      if (!event.cid) return;
      if (channel.cid === event.cid) setUnread(0);
    };
    const { unsubscribe } = client.on('notification.mark_read', handleReadEvent);
    return unsubscribe;
  }, [client, channel]);

  /**
   * This effect listens for the `notification.mark_unread` event and updates the unread count
   */
  useEffect(() => {
    const handleUnreadEvent = (event: Event) => {
      if (!event.cid) return;
      if (channel.cid !== event.cid) return;
      if (event.user?.id !== client.user?.id) return;
      setUnread(channel.countUnread());
    };
    const { unsubscribe } = client.on('notification.mark_unread', handleUnreadEvent);
    return unsubscribe;
  }, [client, channel]);

  const refreshUnreadCount = useMemo(
    () =>
      throttle(() => {
        if (muted) {
          setUnread(0);
        } else {
          setUnread(channel.countUnread());
        }
      }, 400),
    [channel, muted],
  );

  /**
   * This effect listens for the `message.new`, `message.updated`, `message.deleted`, `message.undeleted`, and `channel.truncated` events
   */
  useEffect(() => {
    refreshUnreadCount();

    const handleEvent = () => {
      setLastMessage(channel.state.latestMessages[channel.state.latestMessages.length - 1]);
      refreshUnreadCount();
    };

    const listeners = [
      channel.on('message.new', handleEvent),
      channel.on('message.updated', handleEvent),
      channel.on('message.deleted', handleEvent),
      channel.on('message.undeleted', handleEvent),
      channel.on('channel.truncated', handleEvent),
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [channel, refreshUnreadCount, forceUpdate]);

  return { lastMessage, muted, unread };
};
