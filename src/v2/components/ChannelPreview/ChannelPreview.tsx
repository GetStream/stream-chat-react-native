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

import type { Channel, ChannelState, Event } from 'stream-chat';

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
    ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
  >(
    channel.state.messages[channel.state.messages.length - 1] as ReturnType<
      ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']
    >,
  );
  const [forceUpdate, setForceUpdate] = useState(0);
  const [unread, setUnread] = useState(channel.countUnread());

  const latestMessagePreview = useLatestMessagePreview(
    channel,
    forceUpdate,
    lastMessage,
  );

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.message) {
        setLastMessage(channel.state.messageToImmutable(event.message));
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

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: ChannelPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ChannelPreviewPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    last_message_at: prevLast,
    members: prevMembers,
  } = prevProps.channel.state;
  const {
    last_message_at: nextLast,
    members: nextMembers,
  } = nextProps.channel.state;

  const lastMessageAtEqual = prevLast?.toString() === nextLast?.toString();
  if (!lastMessageAtEqual) return false;

  const membersEqual = Object.keys(prevMembers).every(
    (memberId) =>
      nextMembers[memberId].user?.online === prevMembers[memberId].user?.online,
  );
  if (!membersEqual) return false;

  return true;
};

const MemoizedChannelPreview = React.memo(
  ChannelPreviewWithContext,
  areEqual,
) as typeof ChannelPreviewWithContext;

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

  return <MemoizedChannelPreview {...{ client, Preview }} {...props} />;
};
