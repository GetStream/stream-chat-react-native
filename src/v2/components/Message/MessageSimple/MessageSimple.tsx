import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ChannelContextValue,
  useChannelContext,
} from '../../../contexts/channelContext/ChannelContext';
import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
});

export type MessageSimplePropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> &
  Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'alignment' | 'groupStyles' | 'hasReactions' | 'message'
  > &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'MessageAvatar' | 'MessageContent' | 'ReactionList'
  >;

const MessageSimpleWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageSimplePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    alignment,
    channel,
    groupStyles,
    hasReactions,
    message,
    MessageAvatar,
    MessageContent,
    ReactionList,
  } = props;

  const {
    theme: {
      messageSimple: { container },
    },
  } = useTheme();

  const [messageContentWidth, setMessageContentWidth] = useState(0);

  const isVeryLastMessage =
    channel?.state.messages[channel?.state.messages.length - 1]?.id ===
    message.id;

  const hasMarginBottom =
    groupStyles.includes('single') || groupStyles.includes('bottom');

  const showReactions = hasReactions && ReactionList;

  return (
    <View
      style={[
        styles.container,
        {
          justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end',
          marginBottom: hasMarginBottom ? (isVeryLastMessage ? 30 : 8) : 0,
          marginTop: showReactions ? 2 : 0,
        },
        container,
      ]}
      testID={'message-simple-wrapper'}
    >
      {alignment === 'left' && <MessageAvatar />}
      <MessageContent setMessageContentWidth={setMessageContentWidth} />
      {showReactions && (
        <ReactionList messageContentWidth={messageContentWidth} />
      )}
    </View>
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
  prevProps: MessageSimplePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageSimplePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel: prevChannel,
    groupStyles: prevGroupStyles,
    hasReactions: prevHasReactions,
    message: prevMessage,
  } = prevProps;
  const {
    channel: nextChannel,
    groupStyles: nextGroupStyles,
    hasReactions: nextHasReactions,
    message: nextMessage,
  } = nextProps;

  const channelEqual =
    prevChannel?.state.messages.length === nextChannel?.state.messages.length;
  const groupStylesEqual = prevGroupStyles.length === nextGroupStyles.length;
  const messageEqual = prevMessage.updated_at === nextMessage.updated_at;
  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;

  return (
    channelEqual &&
    groupStylesEqual &&
    hasReactionsEqual &&
    messageEqual &&
    repliesEqual
  );
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areEqual,
) as typeof MessageSimpleWithContext;

export type MessageSimpleProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<MessageSimplePropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 *
 * Message UI component
 *
 * @example ./MessageSimple.md
 */
export const MessageSimple = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { alignment, groupStyles, hasReactions, message } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { MessageAvatar, MessageContent, ReactionList } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedMessageSimple<At, Ch, Co, Ev, Me, Re, Us>
      {...{
        alignment,
        channel,
        groupStyles,
        hasReactions,
        message,
        MessageAvatar,
        MessageContent,
        ReactionList,
      }}
      {...props}
    />
  );
};

MessageSimple.displayName = 'MessageSimple{messageSimple{container}}';
