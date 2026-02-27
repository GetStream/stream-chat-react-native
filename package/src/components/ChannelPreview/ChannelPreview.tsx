import React from 'react';

import type { Channel } from 'stream-chat';

import { useChannelPreviewData } from './hooks/useChannelPreviewData';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTranslatedMessage } from '../../hooks/useTranslatedMessage';
import { SwipableWrapper } from '../UIComponents';

export type ChannelPreviewProps = Partial<Pick<ChatContextValue, 'client'>> &
  Partial<Pick<ChannelsContextValue, 'Preview' | 'forceUpdate'>> & {
    /**
     * Instance of Channel from stream-chat package.
     */
    channel: Channel;
  };

export const ChannelPreview = (props: ChannelPreviewProps) => {
  const { channel, client: propClient, forceUpdate: propForceUpdate, Preview: propPreview } = props;

  const { client: contextClient } = useChatContext();
  const { Preview: contextPreview } = useChannelsContext();

  const client = propClient || contextClient;
  const Preview = propPreview || contextPreview;

  const { muted, unread, lastMessage } = useChannelPreviewData(channel, client, propForceUpdate);

  const translatedLastMessage = useTranslatedMessage(lastMessage);

  const message = translatedLastMessage ? translatedLastMessage : lastMessage;

  return (
    <SwipableWrapper swipeableId={channel.id}>
      <Preview channel={channel} muted={muted} unread={unread} lastMessage={message} />
    </SwipableWrapper>
  );
};
