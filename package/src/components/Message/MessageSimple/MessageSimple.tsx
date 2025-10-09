import React, { useMemo, useState } from 'react';
import { Dimensions, LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedWrapper = Animated.createAnimatedComponent(View);

import { MessageContentProps } from './MessageContent';

import { ReactionListTopProps } from './ReactionList/ReactionListTop';

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
import { NativeHandlers } from '../../../native';

import { checkMessageEquality, checkQuotedMessageEquality } from '../../../utils/utils';
import { useMessageData } from '../hooks/useMessageData';

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  contentContainer: {},
  contentWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
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
  swipeContentContainer: {
    position: 'absolute',
  },
});

export type MessageSimplePropsWithContext = Pick<
  MessageContextValue,
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
  | 'setQuotedMessage'
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
    | 'MessageFooter'
    | 'MessageHeader'
    | 'MessagePinnedHeader'
    | 'MessageReplies'
    | 'MessageStatus'
    | 'MessageSwipeContent'
    | 'messageSwipeToReplyHitSlop'
    | 'ReactionListBottom'
    | 'reactionListPosition'
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

type MessageBubbleProps = Pick<
  MessageSimplePropsWithContext,
  'reactionListPosition' | 'MessageContent' | 'ReactionListTop'
> &
  Pick<
    MessageContentProps,
    | 'isVeryLastMessage'
    | 'backgroundColor'
    | 'messageGroupedSingleOrBottom'
    | 'noBorder'
    | 'setMessageContentWidth'
  > &
  Pick<ReactionListTopProps, 'messageContentWidth'>;

const MessageBubble = ({
  reactionListPosition,
  messageContentWidth,
  setMessageContentWidth,
  MessageContent,
  ReactionListTop,
  backgroundColor,
  isVeryLastMessage,
  messageGroupedSingleOrBottom,
  noBorder,
}: MessageBubbleProps) => {
  const {
    theme: {
      messageSimple: { contentWrapper },
    },
  } = useTheme();

  return (
    <View style={[styles.contentWrapper, contentWrapper]}>
      <MessageContent
        backgroundColor={backgroundColor}
        isVeryLastMessage={isVeryLastMessage}
        messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
        noBorder={noBorder}
        setMessageContentWidth={setMessageContentWidth}
      />
      {reactionListPosition === 'top' && ReactionListTop ? (
        <ReactionListTop messageContentWidth={messageContentWidth} />
      ) : null}
    </View>
  );
};

const SwipableMessageBubble = (
  props: MessageBubbleProps &
    Pick<MessagesContextValue, 'MessageSwipeContent'> &
    Pick<
      MessageSimplePropsWithContext,
      'shouldRenderSwipeableWrapper' | 'messageSwipeToReplyHitSlop'
    > & { onSwipe: () => void },
) => {
  const {
    MessageSwipeContent,
    shouldRenderSwipeableWrapper,
    messageSwipeToReplyHitSlop,
    onSwipe,
    ...messageBubbleProps
  } = props;

  const {
    theme: {
      messageSimple: { contentWrapper, swipeContentContainer },
    },
  } = useTheme();

  const translateX = useSharedValue(0);
  const touchStart = useSharedValue<{ x: number; y: number } | null>(null);
  const isSwiping = useSharedValue<boolean>(false);
  const [shouldRenderAnimatedWrapper, setShouldRenderAnimatedWrapper] = useState<boolean>(
    shouldRenderSwipeableWrapper,
  );

  const SWIPABLE_THRESHOLD = 25;

  const triggerHaptic = NativeHandlers.triggerHaptic;

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .hitSlop(messageSwipeToReplyHitSlop)
        .onBegin((event) => {
          touchStart.value = { x: event.x, y: event.y };
        })
        .onTouchesMove((event, state) => {
          if (!touchStart.value || !event.changedTouches.length) {
            state.fail();
            return;
          }

          const xDiff = Math.abs(event.changedTouches[0].x - touchStart.value.x);
          const yDiff = Math.abs(event.changedTouches[0].y - touchStart.value.y);
          const isHorizontalPanning = xDiff > yDiff;

          if (isHorizontalPanning) {
            state.activate();
            isSwiping.value = true;
            if (!shouldRenderSwipeableWrapper) {
              runOnJS(setShouldRenderAnimatedWrapper)(isSwiping.value);
            }
          } else {
            state.fail();
          }
        })
        .onStart(() => {
          translateX.value = 0;
        })
        .onChange(({ translationX }) => {
          if (translationX > 0) {
            translateX.value = translationX;
          }
        })
        .onEnd(() => {
          if (translateX.value >= SWIPABLE_THRESHOLD) {
            runOnJS(onSwipe)();
            if (triggerHaptic) {
              runOnJS(triggerHaptic)('impactMedium');
            }
          }
          isSwiping.value = false;
          translateX.value = withSpring(
            0,
            {
              dampingRatio: 1,
              duration: 500,
              overshootClamping: true,
              stiffness: 1,
            },
            () => {
              if (!shouldRenderSwipeableWrapper) {
                runOnJS(setShouldRenderAnimatedWrapper)(isSwiping.value);
              }
            },
          );
        }),
    [
      isSwiping,
      messageSwipeToReplyHitSlop,
      onSwipe,
      touchStart,
      translateX,
      triggerHaptic,
      shouldRenderSwipeableWrapper,
    ],
  );

  const messageBubbleAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: translateX.value }],
    }),
    [],
  );

  const swipeContentAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(translateX.value, [0, SWIPABLE_THRESHOLD], [0, 1]),
      transform: [
        {
          translateX: interpolate(
            translateX.value,
            [0, SWIPABLE_THRESHOLD],
            [-SWIPABLE_THRESHOLD, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    }),
    [],
  );

  return (
    <GestureDetector gesture={swipeGesture}>
      <View hitSlop={messageSwipeToReplyHitSlop} style={[styles.contentWrapper, contentWrapper]}>
        {shouldRenderAnimatedWrapper ? (
          <>
            <AnimatedWrapper
              style={[
                styles.swipeContentContainer,
                swipeContentAnimatedStyle,
                swipeContentContainer,
              ]}
            >
              {MessageSwipeContent ? <MessageSwipeContent /> : null}
            </AnimatedWrapper>
            <AnimatedWrapper pointerEvents='box-none' style={messageBubbleAnimatedStyle}>
              <MessageBubble {...messageBubbleProps} />
            </AnimatedWrapper>
          </>
        ) : (
          <MessageBubble {...messageBubbleProps} />
        )}
      </View>
    </GestureDetector>
  );
};

const MessageSimpleWithContext = (props: MessageSimplePropsWithContext) => {
  const [messageContentWidth, setMessageContentWidth] = useState(0);
  const { width } = Dimensions.get('screen');
  const {
    alignment,
    channel,
    customMessageSwipeAction,
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
    messageSwipeToReplyHitSlop = { left: width, right: width },
    onlyEmojis,
    otherAttachments,
    ReactionListBottom,
    reactionListPosition,
    ReactionListTop,
    showMessageStatus,
    shouldRenderSwipeableWrapper,
    setQuotedMessage,
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

  const onSwipeActionHandler = useStableCallback(() => {
    if (customMessageSwipeAction) {
      customMessageSwipeAction({ channel, message });
      return;
    }
    setQuotedMessage(message);
  });

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
          {enableSwipeToReply ? (
            <SwipableMessageBubble
              backgroundColor={backgroundColor}
              isVeryLastMessage={isVeryLastMessage}
              MessageContent={MessageContent}
              messageContentWidth={messageContentWidth}
              messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
              MessageSwipeContent={MessageSwipeContent}
              messageSwipeToReplyHitSlop={messageSwipeToReplyHitSlop}
              noBorder={noBorder}
              onSwipe={onSwipeActionHandler}
              reactionListPosition={reactionListPosition}
              ReactionListTop={ReactionListTop}
              setMessageContentWidth={setMessageContentWidth}
              shouldRenderSwipeableWrapper={shouldRenderSwipeableWrapper}
            />
          ) : (
            <MessageBubble
              backgroundColor={backgroundColor}
              isVeryLastMessage={isVeryLastMessage}
              MessageContent={MessageContent}
              messageContentWidth={messageContentWidth}
              messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
              noBorder={noBorder}
              reactionListPosition={reactionListPosition}
              ReactionListTop={ReactionListTop}
              setMessageContentWidth={setMessageContentWidth}
            />
          )}
          {reactionListPosition === 'bottom' && ReactionListBottom ? <ReactionListBottom /> : null}
          <MessageReplies noBorder={noBorder} repliesCurveColor={repliesCurveColor} />
          <MessageFooter date={message.created_at} isDeleted={!!isMessageTypeDeleted} />
        </View>
      )}
    </View>
  );
};

const areEqual = (
  prevProps: MessageSimplePropsWithContext,
  nextProps: MessageSimplePropsWithContext,
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

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) {
    return false;
  }

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
export const MessageSimple = (props: MessageSimpleProps) => {
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
    isMessageAIGenerated,
    setQuotedMessage,
  } = useMessageContext();
  const {
    customMessageSwipeAction,
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
    messageSwipeToReplyHitSlop,
    myMessageTheme,
    ReactionListBottom,
    reactionListPosition,
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
        messageSwipeToReplyHitSlop,
        myMessageTheme,
        onlyEmojis,
        otherAttachments,
        ReactionListBottom,
        reactionListPosition,
        ReactionListTop,
        setQuotedMessage,
        shouldRenderSwipeableWrapper,
        showMessageStatus,
      }}
      {...props}
    />
  );
};

MessageSimple.displayName = 'MessageSimple{messageSimple{container}}';
