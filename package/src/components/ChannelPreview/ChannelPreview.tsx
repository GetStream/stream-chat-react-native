import React from 'react';

import type { Channel } from 'stream-chat';

import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { useChannelPreviewData } from './hooks/useChannelPreviewData';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';

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
  const { forceUpdate, channel, client, Preview } = props;
  const { muted } = useIsChannelMuted(channel);
  const { lastMessage, unread } = useChannelPreviewData(channel, client, forceUpdate, muted);
  const latestMessagePreview = useLatestMessagePreview(channel, forceUpdate, lastMessage);

  return (
    <Preview
      channel={channel}
      latestMessagePreview={latestMessagePreview}
      muted={muted}
      unread={unread}
    />
  );
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
