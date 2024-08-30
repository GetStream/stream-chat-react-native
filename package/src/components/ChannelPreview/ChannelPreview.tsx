import React, { useEffect, useState } from 'react';

import type { Channel, ChannelState, Event, MessageResponse } from 'stream-chat';

import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelPreviewPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<ChannelsContextValue<StreamChatGenerics>, 'Preview' | 'forceUpdate'> & {
    /**
     * Instance of Channel from stream-chat package.
     */
    channel: Channel<StreamChatGenerics>;
  };

/**
 * This component manages state for the ChannelPreviewMessenger UI component and receives
 * all props from the ChannelListMessenger component.
 */
const ChannelPreviewWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewPropsWithContext<StreamChatGenerics>,
) => {
  const { channel, client, forceUpdate: channelListForceUpdate, Preview } = props;

  const [lastMessage, setLastMessage] = useState<
    | ReturnType<ChannelState<StreamChatGenerics>['formatMessage']>
    | MessageResponse<StreamChatGenerics>
    | undefined
  >(channel.state.messages[channel.state.messages.length - 1]);

  const [forceUpdate, setForceUpdate] = useState(0);
  const [unread, setUnread] = useState(channel.countUnread());

  const latestMessagePreview = useLatestMessagePreview(channel, forceUpdate, lastMessage);

  const channelLastMessage = channel.lastMessage();
  const channelLastMessageString = `${channelLastMessage?.id}${channelLastMessage?.updated_at}`;

  useEffect(() => {
    const { unsubscribe } = client.on('notification.mark_read', () => {
      setUnread(channel.countUnread());
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelLastMessageString, channelListForceUpdate]);

  useEffect(() => {
    const handleNewMessageEvent = (event: Event<StreamChatGenerics>) => {
      const message = event.message;
      if (message && (!message.parent_id || message.show_in_channel)) {
        setLastMessage(event.message);
        setUnread(channel.countUnread());
      }
    };

    const handleUpdatedOrDeletedMessage = (event: Event<StreamChatGenerics>) => {
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
    ];

    return () => listeners.forEach((l) => l.unsubscribe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleReadEvent = (event: Event<StreamChatGenerics>) => {
      if (event.user?.id === client.userID) {
        setUnread(0);
      } else if (event.user?.id) {
        setForceUpdate((prev) => prev + 1);
      }
    };

    const listener = channel.on('message.read', handleReadEvent);
    return () => listener.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Preview channel={channel} latestMessagePreview={latestMessagePreview} unread={unread} />;
};

export type ChannelPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<ChannelPreviewPropsWithContext<StreamChatGenerics>, 'channel'>> &
  Pick<ChannelPreviewPropsWithContext<StreamChatGenerics>, 'channel'>;

export const ChannelPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewProps<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { forceUpdate, Preview } = useChannelsContext<StreamChatGenerics>();

  return <ChannelPreviewWithContext {...{ client, forceUpdate, Preview }} {...props} />;
};
