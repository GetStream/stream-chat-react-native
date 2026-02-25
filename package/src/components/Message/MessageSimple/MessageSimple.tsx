import React, { forwardRef, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { MessageBubble, SwipableMessageBubble } from './MessageBubble';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import { useStableCallback } from '../../../hooks/useStableCallback';

import { primitives } from '../../../theme';
import { checkMessageEquality, checkQuotedMessageEquality } from '../../../utils/utils';
import { useMessageData } from '../hooks/useMessageData';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: primitives.spacingXs,
  },
  contentContainer: {
    gap: primitives.spacingXxs,
  },
  repliesContainer: {
    marginTop: -primitives.spacingXxs, // Reducing the margin to account the gap added in the content container
  },
  lastMessageContainer: {
    marginBottom: 12,
  },
  leftAlignItems: {
    alignItems: 'flex-start',
  },
  messageGroupedSingleOrBottomContainer: {},
  messageGroupedTopContainer: {},
  rightAlignItems: {
    alignItems: 'flex-end',
  },
});

export type MessageSimplePropsWithContext = Pick<
  MessageContextValue,
  | 'alignment'
  | 'channel'
  | 'groupStyles'
  | 'isMyMessage'
  | 'message'
  | 'onlyEmojis'
  | 'otherAttachments'
  | 'setQuotedMessage'
  | 'lastGroupMessage'
  | 'members'
> &
  Pick<
    MessagesContextValue,
    | 'customMessageSwipeAction'
    | 'enableMessageGroupingByUser'
    | 'enableSwipeToReply'
    | 'myMessageTheme'
    | 'MessageAvatar'
    | 'MessageContent'
    | 'MessageDeleted'
    | 'MessageError'
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessageReplies'
    | 'MessageSwipeContent'
    | 'messageSwipeToReplyHitSlop'
    | 'ReactionListBottom'
    | 'reactionListPosition'
    | 'reactionListType'
    | 'ReactionListTop'
  > & {
    /**
     * Will determine whether the swipeable wrapper is always rendered for each
     * message. If set to false, the animated wrapper will be rendered only when
     * a swiping gesture is active and not otherwise.
     * Since stateful components would lose their state if we remount them while
     * an animation is happening, this should always be set to true in those instances.
     */
    shouldRenderSwipeableWrapper: boolean;
  };

const MessageSimpleWithContext = forwardRef<View, MessageSimplePropsWithContext>((props, ref) => {
  const [messageContentWidth, setMessageContentWidth] = useState(0);
  const { width } = Dimensions.get('screen');
  const {
    alignment,
    channel,
    customMessageSwipeAction,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    groupStyles,
    isMyMessage,
    message,
    MessageAvatar,
    MessageContent,
    MessageDeleted,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageSwipeContent,
    messageSwipeToReplyHitSlop = { left: width, right: width },
    onlyEmojis,
    otherAttachments,
    ReactionListBottom,
    reactionListPosition,
    reactionListType,
    ReactionListTop,
    shouldRenderSwipeableWrapper,
    setQuotedMessage,
  } = props;

  const {
    theme: {
      semantics,
      colors: { blue_alice, grey_gainsboro, transparent },
      messageSimple: {
        container,
        repliesContainer,
        content: { container: contentContainer, errorContainer },
        lastMessageContainer,
        messageGroupedSingleOrBottomContainer,
        messageGroupedTopContainer,
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

  const groupStyle = `${alignment}_${groupStyles?.[0]?.toLowerCase?.()}`;

  let noBorder = onlyEmojis && !message.quoted_message;
  if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy' && !isMyMessage) {
      noBorder = false;
    } else {
      noBorder = true;
    }
  }

  let backgroundColor = semantics.chatBgOutgoing;
  if (onlyEmojis && !message.quoted_message) {
    backgroundColor = transparent;
  } else if (otherAttachments.length) {
    if (otherAttachments[0].type === 'giphy') {
      backgroundColor = message.quoted_message ? grey_gainsboro : transparent;
    } else {
      backgroundColor = blue_alice;
    }
  } else if (isMessageReceivedOrErrorType) {
    backgroundColor = semantics.chatBgIncoming;
  }

  const onSwipeActionHandler = useStableCallback(() => {
    if (customMessageSwipeAction) {
      customMessageSwipeAction({ channel, message });
      return;
    }
    setQuotedMessage(message);
  });

  return (
    <View ref={ref}>
      <View
        pointerEvents='box-none'
        style={[
          styles.container,
          messageGroupedSingleOrBottom
            ? isVeryLastMessage && enableMessageGroupingByUser
              ? lastMessageInMessageListStyles
              : messageGroupedSingleOrBottomStyles
            : messageGroupedTopStyles,
          {
            flexDirection: alignment === 'left' ? 'row' : 'row-reverse',
          },
          container,
        ]}
        testID='message-simple-wrapper'
      >
        {alignment === 'left' ? <MessageAvatar /> : null}
        {isMessageTypeDeleted ? (
          <MessageDeleted date={message.created_at} groupStyle={groupStyle} />
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
            {/* TODO: Find a better way to avoid Remounting here. */}
            <MessageHeader />
            {enableSwipeToReply ? (
              <SwipableMessageBubble
                alignment={alignment}
                backgroundColor={backgroundColor}
                isVeryLastMessage={isVeryLastMessage}
                MessageContent={MessageContent}
                messageContentWidth={messageContentWidth}
                messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
                MessageSwipeContent={MessageSwipeContent}
                MessageError={MessageError}
                messageSwipeToReplyHitSlop={messageSwipeToReplyHitSlop}
                noBorder={noBorder}
                onSwipe={onSwipeActionHandler}
                reactionListPosition={reactionListPosition}
                reactionListType={reactionListType}
                ReactionListTop={ReactionListTop}
                setMessageContentWidth={setMessageContentWidth}
                shouldRenderSwipeableWrapper={shouldRenderSwipeableWrapper}
                message={message}
              />
            ) : (
              <MessageBubble
                alignment={alignment}
                backgroundColor={backgroundColor}
                isVeryLastMessage={isVeryLastMessage}
                MessageContent={MessageContent}
                MessageError={MessageError}
                messageContentWidth={messageContentWidth}
                messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
                noBorder={noBorder}
                reactionListPosition={reactionListPosition}
                ReactionListTop={ReactionListTop}
                reactionListType={reactionListType}
                setMessageContentWidth={setMessageContentWidth}
                message={message}
              />
            )}

            <View style={[styles.repliesContainer, repliesContainer]}>
              <MessageReplies />
            </View>

            {reactionListPosition === 'bottom' && ReactionListBottom ? (
              <ReactionListBottom type={reactionListType} />
            ) : null}
            <MessageFooter date={message.created_at} isDeleted={!!isMessageTypeDeleted} />
          </View>
        )}
      </View>
    </View>
  );
});

const areEqual = (
  prevProps: MessageSimplePropsWithContext,
  nextProps: MessageSimplePropsWithContext,
) => {
  const {
    channel: prevChannel,
    groupStyles: prevGroupStyles,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    onlyEmojis: prevOnlyEmojis,
    otherAttachments: prevOtherAttachments,
    lastGroupMessage: prevLastGroupMessage,
    members: prevMembers,
  } = prevProps;
  const {
    channel: nextChannel,
    groupStyles: nextGroupStyles,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    onlyEmojis: nextOnlyEmojis,
    otherAttachments: nextOtherAttachments,
    lastGroupMessage: nextLastGroupMessage,
    members: nextMembers,
  } = nextProps;

  const groupStylesEqual = JSON.stringify(prevGroupStyles) === JSON.stringify(nextGroupStyles);
  if (!groupStylesEqual) {
    return false;
  }

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) {
    return false;
  }

  const membersEqual = Object.keys(prevMembers).length === Object.keys(nextMembers).length;
  if (!membersEqual) {
    return false;
  }

  const messageEqual = checkMessageEquality(prevMessage, nextMessage);
  if (!messageEqual) {
    return false;
  }

  const quotedMessageEqual = checkQuotedMessageEquality(
    prevMessage.quoted_message,
    nextMessage.quoted_message,
  );

  if (!quotedMessageEqual) {
    return false;
  }

  const channelEqual = prevChannel?.state.messages.length === nextChannel?.state.messages.length;
  if (!channelEqual) {
    return false;
  }

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
  if (!attachmentsEqual) {
    return false;
  }

  const quotedMessageAttachmentsEqual =
    prevMessage.quoted_message?.attachments?.length ===
    nextMessage.quoted_message?.attachments?.length;

  if (!quotedMessageAttachmentsEqual) {
    return false;
  }

  const latestReactionsEqual =
    Array.isArray(prevMessage.latest_reactions) && Array.isArray(nextMessage.latest_reactions)
      ? prevMessage.latest_reactions.length === nextMessage.latest_reactions.length &&
        prevMessage.latest_reactions.every(
          ({ type }, index) => type === nextMessage.latest_reactions?.[index].type,
        )
      : prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) {
    return false;
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) {
    return false;
  }

  const otherAttachmentsEqual =
    prevOtherAttachments.length === nextOtherAttachments.length &&
    prevOtherAttachments?.[0]?.actions?.length === nextOtherAttachments?.[0]?.actions?.length;
  if (!otherAttachmentsEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areEqual,
) as typeof MessageSimpleWithContext;

export type MessageSimpleProps = Partial<MessageSimplePropsWithContext>;

/**
 *
 * Message UI component
 */
export const MessageSimple = forwardRef<View, MessageSimpleProps>((props, ref) => {
  const {
    alignment,
    channel,
    groupStyles,
    isMyMessage,
    message,
    onlyEmojis,
    otherAttachments,
    isMessageAIGenerated,
    setQuotedMessage,
    lastGroupMessage,
    members,
  } = useMessageContext();

  const {
    customMessageSwipeAction,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    MessageAvatar,
    MessageContent,
    MessageDeleted,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessageReplies,
    MessageSwipeContent,
    messageSwipeToReplyHitSlop,
    myMessageTheme,
    ReactionListBottom,
    reactionListPosition,
    reactionListType,
    ReactionListTop,
  } = useMessagesContext();
  const isAIGenerated = useMemo(
    () => isMessageAIGenerated(message),
    [message, isMessageAIGenerated],
  );
  const shouldRenderSwipeableWrapper = (message?.attachments || []).length > 0 || isAIGenerated;

  return (
    <MemoizedMessageSimple
      {...{
        alignment,
        channel,
        customMessageSwipeAction,
        enableMessageGroupingByUser,
        enableSwipeToReply,
        groupStyles,
        isMyMessage,
        message,
        MessageAvatar,
        MessageContent,
        MessageDeleted,
        MessageError,
        MessageFooter,
        MessageHeader,
        MessageReplies,
        MessageSwipeContent,
        messageSwipeToReplyHitSlop,
        myMessageTheme,
        onlyEmojis,
        otherAttachments,
        ReactionListBottom,
        reactionListPosition,
        reactionListType,
        ReactionListTop,
        setQuotedMessage,
        shouldRenderSwipeableWrapper,
        lastGroupMessage,
        members,
      }}
      ref={ref}
      {...props}
    />
  );
});

MessageSimple.displayName = 'MessageSimple{messageSimple{container}}';
