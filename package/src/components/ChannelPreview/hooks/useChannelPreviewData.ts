import { useEffect, useMemo, useState } from 'react';

import throttle from 'lodash/throttle';
import type { Channel, ChannelState, Event, MessageResponse, StreamChat } from 'stream-chat';

import { useIsChannelMuted } from './useIsChannelMuted';

import { useLatestMessagePreview } from './useLatestMessagePreview';

import { useChannelsContext } from '../../../contexts';

export const useChannelPreviewData = (
  channel: Channel,
  client: StreamChat,
  forceUpdateOverride?: number,
) => {
  const [forceUpdate, setForceUpdate] = useState(0);
  const [lastMessage, setLastMessage] = useState<
    ReturnType<ChannelState['formatMessage']> | MessageResponse
  >(channel.state.messages[channel.state.messages.length - 1]);
  const [unread, setUnread] = useState(channel.countUnread());
  const { muted } = useIsChannelMuted(channel);
  const { forceUpdate: contextForceUpdate } = useChannelsContext();
  const channelListForceUpdate = forceUpdateOverride ?? contextForceUpdate;

  const channelLastMessage = channel.lastMessage();
  const channelLastMessageString = `${channelLastMessage?.id}${channelLastMessage?.updated_at}`;

  useEffect(() => {
    const unsubscribe = channel.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [channel.messageComposer]);

  useEffect(() => {
    const { unsubscribe } = client.on('notification.mark_read', () => {
      setUnread(channel.countUnread());
    });
    return unsubscribe;
  }, [channel, client]);

  useEffect(() => {
    if (
      channelLastMessage &&
      (channelLastMessage.id !== lastMessage?.id ||
        channelLastMessage.updated_at !== lastMessage?.updated_at)
    ) {
      setLastMessage(channelLastMessage);
    }
    const newUnreadCount = channel.countUnread();
    setUnread(newUnreadCount);
  }, [channel, channelLastMessage, channelLastMessageString, channelListForceUpdate, lastMessage]);

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
    const { unsubscribe } = client.on('message.read', handleReadEvent);
    return unsubscribe;
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

    const handleNewMessageEvent = (event: Event) => {
      const message = event.message;
      if (message && (!message.parent_id || message.show_in_channel)) {
        setLastMessage(message);
        setUnread(channel.countUnread());
      }
    };

    const handleUpdatedOrDeletedMessage = (event: Event) => {
      setLastMessage((prevLastMessage) => {
        if (prevLastMessage?.id === event.message?.id) {
          return event.message;
        }
        return prevLastMessage;
      });
    };

    const listeners = [
      channel.on('message.new', handleNewMessageEvent),
      channel.on('message.updated', handleUpdatedOrDeletedMessage),
      channel.on('message.deleted', handleUpdatedOrDeletedMessage),
      channel.on('message.undeleted', handleEvent),
      channel.on('channel.truncated', handleEvent),
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
  }, [channel, refreshUnreadCount, forceUpdate, channelListForceUpdate]);

  const latestMessagePreview = useLatestMessagePreview(channel, forceUpdate, lastMessage);

  return { latestMessagePreview, muted, unread };
};
