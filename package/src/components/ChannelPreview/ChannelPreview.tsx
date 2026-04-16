import React from 'react';

import type { Channel } from 'stream-chat';

import { ChannelSwipableWrapper } from './ChannelSwipableWrapper';
import { useChannelPreviewData } from './hooks/useChannelPreviewData';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTranslatedMessage } from '../../hooks/useTranslatedMessage';

export type ChannelPreviewProps = Partial<Pick<ChatContextValue, 'client'>> &
  Partial<Pick<ChannelsContextValue, 'forceUpdate'>> & {
    /**
     * Instance of Channel from stream-chat package.
     */
    channel: Channel;
  };

export const ChannelPreview = (props: ChannelPreviewProps) => {
  const { channel, client: propClient, forceUpdate: propForceUpdate } = props;

  const { client: contextClient } = useChatContext();
  const { getChannelActionItems, swipeActionsEnabled } = useChannelsContext();
  const { ChannelPreview } = useComponentsContext();

  const client = propClient || contextClient;

  const { muted, unread, lastMessage } = useChannelPreviewData(channel, client, propForceUpdate);

  const translatedLastMessage = useTranslatedMessage(lastMessage);

  const message = translatedLastMessage ? translatedLastMessage : lastMessage;

  if (!swipeActionsEnabled) {
    return <ChannelPreview channel={channel} muted={muted} unread={unread} lastMessage={message} />;
  }

  return (
    <ChannelSwipableWrapper channel={channel} getChannelActionItems={getChannelActionItems}>
      <ChannelPreview channel={channel} muted={muted} unread={unread} lastMessage={message} />
    </ChannelSwipableWrapper>
  );
};
