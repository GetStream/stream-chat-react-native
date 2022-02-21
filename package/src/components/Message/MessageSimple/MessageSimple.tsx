import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
});

export type MessageSimplePropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  'alignment' | 'channel' | 'groupStyles' | 'hasReactions' | 'message'
> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'enableMessageGroupingByUser'
    | 'MessageAvatar'
    | 'MessageContent'
    | 'MessagePinnedHeader'
    | 'ReactionList'
  >;

const MessageSimpleWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageSimplePropsWithContext<StreamChatGenerics>,
) => {
  const {
    alignment,
    channel,
    enableMessageGroupingByUser,
    groupStyles,
    hasReactions,
    message,
    MessageAvatar,
    MessageContent,
    MessagePinnedHeader,
    ReactionList,
  } = props;

  const {
    theme: {
      messageSimple: { container },
    },
  } = useTheme('MessageSimple');

  const [messageContentWidth, setMessageContentWidth] = useState(0);

  const isVeryLastMessage =
    channel?.state.messages[channel?.state.messages.length - 1]?.id === message.id;

  const hasMarginBottom = groupStyles.includes('single') || groupStyles.includes('bottom');

  const showReactions = hasReactions && ReactionList;

  return (
    <>
      {message.pinned && <MessagePinnedHeader />}
      <View
        style={[
          styles.container,
          {
            justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end',
            marginBottom: hasMarginBottom
              ? isVeryLastMessage && enableMessageGroupingByUser
                ? 30
                : 8
              : 0,
            marginTop: showReactions ? 2 : 0,
          },
          container,
        ]}
        testID='message-simple-wrapper'
      >
        {alignment === 'left' && <MessageAvatar />}
        <MessageContent setMessageContentWidth={setMessageContentWidth} />
        {showReactions && <ReactionList messageContentWidth={messageContentWidth} />}
      </View>
    </>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageSimplePropsWithContext<StreamChatGenerics>,
  nextProps: MessageSimplePropsWithContext<StreamChatGenerics>,
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

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) return false;

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) return false;

  const groupStylesEqual = JSON.stringify(prevGroupStyles) === JSON.stringify(nextGroupStyles);
  if (!groupStylesEqual) return false;

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.pinned === nextMessage.pinned;
  if (!messageEqual) return false;

  const isPrevQuotedMessageTypeDeleted = prevMessage.quoted_message?.type === 'deleted';
  const isNextQuotedMessageTypeDeleted = nextMessage.quoted_message?.type === 'deleted';

  const quotedMessageEqual =
    prevMessage.quoted_message?.id === nextMessage.quoted_message?.id &&
    isPrevQuotedMessageTypeDeleted === isNextQuotedMessageTypeDeleted;

  if (!quotedMessageEqual) return false;

  const channelEqual = prevChannel?.state.messages.length === nextChannel?.state.messages.length;
  if (!channelEqual) return false;

  const prevAttachments = prevMessage.attachments;
  const nextAttachments = nextMessage.attachments;
  const attachmentsEqual =
    Array.isArray(prevAttachments) && Array.isArray(nextAttachments)
      ? prevAttachments.length === nextAttachments.length &&
        prevAttachments.every(
          (attachment, index) =>
            attachment.image_url === nextAttachments[index].image_url &&
            attachment.og_scrape_url === nextAttachments[index].og_scrape_url &&
            attachment.thumb_url === nextAttachments[index].thumb_url,
        )
      : prevAttachments === nextAttachments;
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  return true;
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areEqual,
) as typeof MessageSimpleWithContext;

export type MessageSimpleProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageSimplePropsWithContext<StreamChatGenerics>>;

/**
 *
 * Message UI component
 */
export const MessageSimple = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageSimpleProps<StreamChatGenerics>,
) => {
  const { alignment, channel, groupStyles, hasReactions, message } =
    useMessageContext<StreamChatGenerics>('MessageSimple');
  const {
    enableMessageGroupingByUser,
    MessageAvatar,
    MessageContent,
    MessagePinnedHeader,
    ReactionList,
  } = useMessagesContext<StreamChatGenerics>('MessageSimple');

  return (
    <MemoizedMessageSimple<StreamChatGenerics>
      {...{
        alignment,
        channel,
        enableMessageGroupingByUser,
        groupStyles,
        hasReactions,
        message,
        MessageAvatar,
        MessageContent,
        MessagePinnedHeader,
        ReactionList,
      }}
      {...props}
    />
  );
};

MessageSimple.displayName = 'MessageSimple{messageSimple{container}}';
