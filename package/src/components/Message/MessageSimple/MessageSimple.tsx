import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { triggerHaptic } from '../../../native';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useMessageData } from '../hooks/useMessageData';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  contentContainer: {},
  contentWrapper: {
    flexDirection: 'row',
    overflow: 'visible',
  },

  lastMessageContainer: {
    marginBottom: 12,
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  messageGroupedSingleOrBottomContainer: {
    marginBottom: 8,
  },
  messageGroupedTopContainer: {},
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

export type MessageSimplePropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  | 'alignment'
  | 'channel'
  | 'groupStyles'
  | 'hasReactions'
  | 'isMyMessage'
  | 'lastGroupMessage'
  | 'members'
  | 'message'
  | 'onlyEmojis'
  | 'otherAttachments'
  | 'showMessageStatus'
> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'clearQuotedMessageState'
    | 'enableMessageGroupingByUser'
    | 'enableSwipeToReply'
    | 'myMessageTheme'
    | 'MessageAvatar'
    | 'MessageContent'
    | 'MessageDeleted'
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessagePinnedHeader'
    | 'MessageReplies'
    | 'MessageStatus'
    | 'MessageSwipeContent'
    | 'ReactionListBottom'
    | 'reactionListPosition'
    | 'ReactionListTop'
    | 'setQuotedMessageState'
  >;

const MessageSimpleWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageSimplePropsWithContext<StreamChatGenerics>,
) => {
  const [messageContentWidth, setMessageContentWidth] = useState(0);
  const swipeableRef = useRef<SwipeableMethods | null>(null);

  const {
    alignment,
    clearQuotedMessageState,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    groupStyles,
    hasReactions,
    isMyMessage,
    lastGroupMessage,
    members,
    message,
    MessageAvatar,
    MessageContent,
    MessageDeleted,
    MessageFooter,
    MessageHeader,
    MessagePinnedHeader,
    MessageReplies,
    MessageStatus,
    MessageSwipeContent,
    onlyEmojis,
    otherAttachments,
    ReactionListBottom,
    reactionListPosition,
    ReactionListTop,
    setQuotedMessageState,
    showMessageStatus,
  } = props;

  const {
    theme: {
      colors: { blue_alice, grey_gainsboro, light_blue, light_gray, transparent },
      messageSimple: {
        container,
        content: {
          container: contentContainer,
          errorContainer,
          receiverMessageBackgroundColor,
          senderMessageBackgroundColor,
        },
        contentWrapper,
        headerWrapper,
        lastMessageContainer,
        messageGroupedSingleOrBottomContainer,
        messageGroupedTopContainer,
        reactionListTop: { position: reactionPosition },
      },
    },
  } = useTheme();

  const {
    isMessageErrorType,
    isMessageReceivedOrErrorType,
    isMessageTypeDeleted,
    isVeryLastMessage,
    messageGroupedSingleOrBottom,
  } = useMessageData({});

  const lastMessageInMessageListStyles = [styles.lastMessageContainer, lastMessageContainer];
  const messageGroupedSingleOrBottomStyles = {
    ...styles.messageGroupedSingleOrBottomContainer,
    ...messageGroupedSingleOrBottomContainer,
  };
  const messageGroupedTopStyles = {
    ...styles.messageGroupedTopContainer,
    ...messageGroupedTopContainer,
  };

  const onLayout: (event: LayoutChangeEvent) => void = ({
    nativeEvent: {
      layout: { width },
    },
  }) => {
    setMessageContentWidth(width);
  };

  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;

  let noBorder = onlyEmojis && !message.quoted_message;
  if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy' && !isMyMessage) {
      noBorder = false;
    } else {
      noBorder = true;
    }
  }

  let backgroundColor = senderMessageBackgroundColor ?? light_blue;
  if (onlyEmojis && !message.quoted_message) {
    backgroundColor = transparent;
  } else if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy') {
      backgroundColor = message.quoted_message ? grey_gainsboro : transparent;
    } else {
      backgroundColor = blue_alice;
    }
  } else if (isMessageReceivedOrErrorType) {
    backgroundColor = receiverMessageBackgroundColor ?? light_gray;
  }

  const repliesCurveColor = isMessageReceivedOrErrorType ? grey_gainsboro : backgroundColor;

  const renderMessageBubble = (
    <>
      <MessageContent
        backgroundColor={backgroundColor}
        noBorder={noBorder}
        setMessageContentWidth={setMessageContentWidth}
      />
      {reactionListPosition === 'top' && ReactionListTop ? (
        <ReactionListTop messageContentWidth={messageContentWidth} />
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.container,
        messageGroupedSingleOrBottom
          ? isVeryLastMessage && enableMessageGroupingByUser
            ? lastMessageInMessageListStyles
            : messageGroupedSingleOrBottomStyles
          : messageGroupedTopStyles,
        {
          justifyContent: alignment === 'left' ? 'flex-start' : 'flex-end',
        },
        container,
      ]}
      testID='message-simple-wrapper'
    >
      {alignment === 'left' ? <MessageAvatar /> : null}
      {isMessageTypeDeleted ? (
        <MessageDeleted
          date={message.created_at}
          groupStyle={groupStyle}
          noBorder={noBorder}
          onLayout={onLayout}
        />
      ) : (
        <View
          style={[
            styles.contentContainer,
            isMyMessage ? styles.rightAlignItems : styles.leftAlignItems,
            isMessageErrorType ? errorContainer : {},
            contentContainer,
          ]}
          testID='message-components'
        >
          <View
            style={[
              {
                paddingBottom:
                  hasReactions && reactionListPosition === 'top' ? reactionPosition : 2,
              },
              headerWrapper,
            ]}
          >
            {MessageHeader && (
              <MessageHeader
                alignment={alignment}
                date={message.created_at}
                isDeleted={isMessageTypeDeleted}
                lastGroupMessage={lastGroupMessage}
                members={members}
                message={message}
                MessageStatus={MessageStatus}
                otherAttachments={otherAttachments}
                showMessageStatus={showMessageStatus}
              />
            )}
            {message.pinned ? <MessagePinnedHeader /> : null}
          </View>

          {alignment === 'left' ? (
            <Swipeable
              containerStyle={[styles.contentWrapper, contentWrapper]}
              friction={2}
              leftThreshold={100}
              onSwipeableWillOpen={() => {
                if (!swipeableRef.current) return;
                clearQuotedMessageState();
                setQuotedMessageState(message);
                triggerHaptic('impactLight');
                swipeableRef.current.close();
              }}
              ref={swipeableRef}
              renderLeftActions={() => {
                if (enableSwipeToReply) {
                  return MessageSwipeContent ? <MessageSwipeContent /> : null;
                } else {
                  return null;
                }
              }}
            >
              {renderMessageBubble}
            </Swipeable>
          ) : (
            <Swipeable
              containerStyle={[styles.contentWrapper, contentWrapper]}
              friction={2}
              onSwipeableWillOpen={() => {
                if (!swipeableRef.current) return;
                clearQuotedMessageState();
                setQuotedMessageState(message);
                triggerHaptic('impactLight');
                swipeableRef.current.close();
              }}
              ref={swipeableRef}
              renderRightActions={() => {
                if (enableSwipeToReply) {
                  return MessageSwipeContent ? <MessageSwipeContent /> : null;
                } else {
                  return null;
                }
              }}
              rightThreshold={100}
            >
              {renderMessageBubble}
            </Swipeable>
          )}

          {reactionListPosition === 'bottom' && ReactionListBottom ? <ReactionListBottom /> : null}
          <MessageReplies noBorder={noBorder} repliesCurveColor={repliesCurveColor} />
          <MessageFooter date={message.created_at} isDeleted={!!isMessageTypeDeleted} />
        </View>
      )}
    </View>
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
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    onlyEmojis: prevOnlyEmojis,
    otherAttachments: prevOtherAttachments,
  } = prevProps;
  const {
    channel: nextChannel,
    groupStyles: nextGroupStyles,
    hasReactions: nextHasReactions,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    onlyEmojis: nextOnlyEmojis,
    otherAttachments: nextOtherAttachments,
  } = nextProps;

  const repliesEqual = prevMessage.reply_count === nextMessage.reply_count;
  if (!repliesEqual) return false;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) return false;

  const groupStylesEqual = JSON.stringify(prevGroupStyles) === JSON.stringify(nextGroupStyles);
  if (!groupStylesEqual) return false;

  const isPrevMessageTypeDeleted = prevMessage.type === 'deleted';
  const isNextMessageTypeDeleted = nextMessage.type === 'deleted';

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) return false;

  const messageEqual =
    isPrevMessageTypeDeleted === isNextMessageTypeDeleted &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text &&
    prevMessage.i18n === nextMessage.i18n &&
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

  const prevMessageAttachments = prevMessage.attachments;
  const nextMessageAttachments = nextMessage.attachments;
  const attachmentsEqual =
    Array.isArray(prevMessageAttachments) && Array.isArray(nextMessageAttachments)
      ? prevMessageAttachments.length === nextMessageAttachments.length &&
        prevMessageAttachments.every((attachment, index) => {
          const attachmentKeysEqual =
            attachment.image_url === nextMessageAttachments[index].image_url &&
            attachment.og_scrape_url === nextMessageAttachments[index].og_scrape_url &&
            attachment.thumb_url === nextMessageAttachments[index].thumb_url &&
            attachment.type === nextMessageAttachments[index].type;

          return attachmentKeysEqual;
        })
      : prevMessageAttachments === nextMessageAttachments;
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) return false;

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) return false;

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) return false;

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
  const {
    alignment,
    channel,
    groupStyles,
    hasReactions,
    isMyMessage,
    lastGroupMessage,
    members,
    message,
    onlyEmojis,
    otherAttachments,
    showMessageStatus,
  } = useMessageContext<StreamChatGenerics>();
  const {
    clearQuotedMessageState,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    MessageAvatar,
    MessageContent,
    MessageDeleted,
    MessageFooter,
    MessageHeader,
    MessagePinnedHeader,
    MessageReplies,
    MessageStatus,
    MessageSwipeContent,
    myMessageTheme,
    ReactionListBottom,
    reactionListPosition,
    ReactionListTop,
    setQuotedMessageState,
  } = useMessagesContext<StreamChatGenerics>();

  return (
    <MemoizedMessageSimple<StreamChatGenerics>
      {...{
        alignment,
        channel,
        clearQuotedMessageState,
        enableMessageGroupingByUser,
        enableSwipeToReply,
        groupStyles,
        hasReactions,
        isMyMessage,
        lastGroupMessage,
        members,
        message,
        MessageAvatar,
        MessageContent,
        MessageDeleted,
        MessageFooter,
        MessageHeader,
        MessagePinnedHeader,
        MessageReplies,
        MessageStatus,
        MessageSwipeContent,
        myMessageTheme,
        onlyEmojis,
        otherAttachments,
        ReactionListBottom,
        reactionListPosition,
        ReactionListTop,
        setQuotedMessageState,
        showMessageStatus,
      }}
      {...props}
    />
  );
};

MessageSimple.displayName = 'MessageSimple{messageSimple{container}}';
