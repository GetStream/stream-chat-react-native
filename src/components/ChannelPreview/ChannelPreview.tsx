import React, { useEffect, useState } from 'react';

import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { useLatestMessagePreview } from './hooks/useLatestMessagePreview';

import { useChatContext } from '../../contexts/chatContext/ChatContext';

import type {
  Channel,
  ChannelState,
  Event,
  MessageResponse,
} from 'stream-chat';

import type { ChannelListMessengerProps } from '../ChannelList/ChannelListMessenger';
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

export type ChannelPreviewProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ChannelListMessengerProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /**
   * The previewed channel
   */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
};

/**
 * This component manages state for the ChannelPreviewMessenger UI component and receives
 * all props from the ChannelListMessenger component.
 */
const UnMemoizedChannelPreview = <
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
  const { channel, forceUpdate, Preview = ChannelPreviewMessenger } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [lastMessage, setLastMessage] = useState<
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageResponse<At, Ch, Co, Me, Re, Us>
  >();
  const [unread, setUnread] = useState(channel.countUnread());

  const latestMessagePreview = useLatestMessagePreview(channel, lastMessage);

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
    setUnread(channel.countUnread());
  }, [forceUpdate]);

  useEffect(() => {
    const handleReadEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.user?.id === client.userID) {
        setUnread(0);
      }
    };

    channel.on('message.read', handleReadEvent);
    return () => channel.off('message.read', handleReadEvent);
  }, []);

  return (
    <Preview<At, Ch, Co, Ev, Me, Re, Us>
      {...props}
      lastMessage={lastMessage}
      latestMessagePreview={latestMessagePreview}
      unread={unread}
    />
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { last_message_at: previousLast } = prevProps.channel.state;
  const { last_message_at: nextLast } = nextProps.channel.state;

  return (
    previousLast === nextLast && prevProps.forceUpdate === nextProps.forceUpdate
  );
};

export const ChannelPreview = React.memo(
  UnMemoizedChannelPreview,
  areEqual,
) as typeof UnMemoizedChannelPreview;
