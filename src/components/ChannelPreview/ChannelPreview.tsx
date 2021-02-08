import React, { useEffect, useState } from 'react';

import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';

import type {
  Channel,
  ChannelState,
  Event,
  MessageResponse,
} from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChannelPreviewPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'Preview'> & {
    /**
     * The previewed channel
     */
    channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  };

/**
 * This component manages state for the ChannelPreviewMessenger UI component and receives
 * all props from the ChannelListMessenger component.
 */
const ChannelPreviewWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, client, Preview } = props;

  const [lastMessage, setLastMessage] = useState<
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['formatMessage']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>
  >([...channel.state.messages][channel.state.messages.length - 1]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [unread, setUnread] = useState(channel.countUnread());

  const latestMessagePreview = useLatestMessagePreview(
    channel,
    forceUpdate,
    lastMessage,
  );

  const channelLastMessageString = `${channel.lastMessage()?.id} ${
    channel.lastMessage()?.updated_at
  }`;
  useEffect(() => {
    const channelLastMessage = channel.lastMessage();
    if (
      channelLastMessage &&
      (channelLastMessage.id !== lastMessage.id ||
        channelLastMessage.updated_at !== lastMessage.updated_at)
    ) {
      setLastMessage(channelLastMessage);
    }
  }, [channelLastMessageString]);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
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
    const handleReadEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.user?.id === client.userID) {
        setUnread(0);
      } else if (event.user?.id) {
        setForceUpdate((prev) => prev + 1);
      }
    };

    channel.on('message.read', handleReadEvent);
    return () => channel.off('message.read', handleReadEvent);
  }, []);

  return (
    <Preview
      channel={channel}
      latestMessagePreview={latestMessagePreview}
      unread={unread}
    />
  );
};

export type ChannelPreviewProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Omit<ChannelPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>
> &
  Pick<ChannelPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'channel'>;

export const ChannelPreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { Preview } = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <ChannelPreviewWithContext {...{ client, Preview }} {...props} />;
};
