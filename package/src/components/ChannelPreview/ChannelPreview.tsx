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
  Pick<ChannelsContextValue<StreamChatGenerics>, 'Preview'> & {
    /**
     * The previewed channel
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
  const { channel, client, Preview } = props;

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
    if (
      channelLastMessage &&
      (channelLastMessage.id !== lastMessage?.id ||
        channelLastMessage.updated_at !== lastMessage?.updated_at)
    ) {
      setLastMessage(channelLastMessage);
    }

    const newUnreadCount = channel.countUnread();

    if (newUnreadCount !== unread) {
      setUnread(newUnreadCount);
    }
  }, [channelLastMessageString]);

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (event.message) {
        setLastMessage(event.message);
      }

      if (event.type === 'message.new') {
        setUnread(channel.countUnread());
      }
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, []);

  useEffect(() => {
    const handleReadEvent = (event: Event<StreamChatGenerics>) => {
      if (event.user?.id === client.userID) {
        setUnread(0);
      } else if (event.user?.id) {
        setForceUpdate((prev) => prev + 1);
      }
    };

    channel.on('message.read', handleReadEvent);
    return () => channel.off('message.read', handleReadEvent);
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
  const { client } = useChatContext<StreamChatGenerics>('ChannelPreview');
  const { Preview } = useChannelsContext<StreamChatGenerics>('ChannelPreview');

  return <ChannelPreviewWithContext {...{ client, Preview }} {...props} />;
};
