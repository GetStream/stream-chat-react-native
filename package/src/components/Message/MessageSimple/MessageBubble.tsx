import React, { SetStateAction, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { MessageContentProps } from './MessageContent';
import { MessageSimplePropsWithContext } from './MessageSimple';

import { MessagesContextValue, useTheme } from '../../../contexts';

import { useStableCallback } from '../../../hooks';
import { NativeHandlers } from '../../../native';
import { MessageStatusTypes } from '../../../utils/utils';

export type MessageBubbleProps = Pick<
  MessagesContextValue,
  | 'reactionListPosition'
  | 'MessageContent'
  | 'ReactionListTop'
  | 'MessageError'
  | 'reactionListType'
> &
  Pick<
    MessageContentProps,
    | 'isVeryLastMessage'
    | 'backgroundColor'
    | 'messageGroupedSingleOrBottom'
    | 'noBorder'
    | 'message'
    | 'setMessageContentWidth'
  > &
  Pick<MessageSimplePropsWithContext, 'alignment'> & {
    messageContentWidth: number;
  };

export const MessageBubble = React.memo(
  ({
    alignment,
    reactionListPosition,
    reactionListType,
    setMessageContentWidth,
    MessageContent,
    ReactionListTop,
    backgroundColor,
    isVeryLastMessage,
    messageGroupedSingleOrBottom,
    noBorder,
    MessageError,
    message,
  }: MessageBubbleProps) => {
    const styles = useStyles({ alignment });
    const isMessageErrorType =
      message?.type === 'error' || message?.status === MessageStatusTypes.FAILED;

    return (
      <View style={styles.wrapper}>
        {reactionListPosition === 'top' && ReactionListTop ? (
          <View style={styles.reactionListTopContainer}>
            <ReactionListTop type={reactionListType} />
          </View>
        ) : null}
        <View style={styles.contentContainer}>
          <MessageContent
            backgroundColor={backgroundColor}
            isVeryLastMessage={isVeryLastMessage}
            messageGroupedSingleOrBottom={messageGroupedSingleOrBottom}
            noBorder={noBorder}
            setMessageContentWidth={setMessageContentWidth}
          />

          {isMessageErrorType ? (
            <View style={styles.errorContainer}>
              <MessageError />
            </View>
          ) : null}
        </View>
      </View>
    );
  },
);

const AnimatedWrapper = Animated.createAnimatedComponent(View);

export const SwipableMessageBubble = React.memo(
  (
    props: MessageBubbleProps &
      Pick<MessagesContextValue, 'MessageSwipeContent'> &
      Pick<
        MessageSimplePropsWithContext,
        'shouldRenderSwipeableWrapper' | 'messageSwipeToReplyHitSlop'
      > & { onSwipe: () => void },
  ) => {
    const { MessageSwipeContent, messageSwipeToReplyHitSlop, onSwipe, ...messageBubbleProps } =
      props;

    const styles = useStyles({ alignment: props.alignment });

    const translateX = useSharedValue(0);
    const touchStart = useSharedValue<{ x: number; y: number } | null>(null);
    const isSwiping = useSharedValue<boolean>(false);
    const [shouldRenderAnimatedWrapper, setShouldRenderAnimatedWrapper] = useState<boolean>(false);

    const SWIPABLE_THRESHOLD = 25;
    const MINIMUM_DISTANCE = 8;

    const triggerHaptic = NativeHandlers.triggerHaptic;

    const setMessageContentWidth = useStableCallback((valueOrCallback: SetStateAction<number>) => {
      if (typeof valueOrCallback === 'number') {
        props.setMessageContentWidth(Math.ceil(valueOrCallback));
        return;
      }
      props.setMessageContentWidth(valueOrCallback);
    });

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
            const hasMinimumDistance = xDiff > MINIMUM_DISTANCE || yDiff > MINIMUM_DISTANCE;

            // Only activate if there's significant horizontal movement
            if (isHorizontalPanning && hasMinimumDistance) {
              state.activate();
              if (!isSwiping.value) {
                runOnJS(setShouldRenderAnimatedWrapper)(true);
              }
              isSwiping.value = true;
            } else if (hasMinimumDistance) {
              // If there's significant movement but not horizontal, fail the gesture
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
                runOnJS(setShouldRenderAnimatedWrapper)(false);
              },
            );
          }),
      [messageSwipeToReplyHitSlop, touchStart, isSwiping, translateX, onSwipe, triggerHaptic],
    );

    const swipeContentAnimatedStyle = useAnimatedStyle(
      () => ({
        opacity: interpolate(translateX.value, [0, SWIPABLE_THRESHOLD], [0, 1]),
        width: translateX.value,
      }),
      [],
    );

    return (
      <GestureDetector gesture={swipeGesture}>
        <View
          hitSlop={messageSwipeToReplyHitSlop}
          style={[
            styles.contentWrapper,
            props.messageContentWidth > 0 && shouldRenderAnimatedWrapper
              ? { width: props.messageContentWidth }
              : {},
          ]}
        >
          {shouldRenderAnimatedWrapper ? (
            <AnimatedWrapper style={[styles.swipeContentContainer, swipeContentAnimatedStyle]}>
              {MessageSwipeContent ? <MessageSwipeContent /> : null}
            </AnimatedWrapper>
          ) : null}
          <MessageBubble {...messageBubbleProps} setMessageContentWidth={setMessageContentWidth} />
        </View>
      </GestureDetector>
    );
  },
);

const useStyles = ({ alignment }: { alignment?: 'left' | 'right' }) => {
  const {
    theme: {
      messageSimple: {
        bubble: { contentContainer, errorContainer, reactionListTopContainer, wrapper },
        contentWrapper,
        swipeContentContainer,
      },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      contentWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
        zIndex: 1, // To hide the stick inside the message content
        ...contentWrapper,
      },
      contentContainer: {
        alignSelf: alignment === 'left' ? 'flex-start' : 'flex-end',
        ...contentContainer,
      },
      swipeContentContainer: {
        ...swipeContentContainer,
      },
      errorContainer: {
        position: 'absolute',
        top: 8,
        right: -12,
        ...errorContainer,
      },
      reactionListTopContainer: {
        alignSelf: alignment === 'left' ? 'flex-end' : 'flex-start',
        ...reactionListTopContainer,
      },
      wrapper: {
        ...wrapper,
      },
    });
  }, [
    alignment,
    contentContainer,
    contentWrapper,
    errorContainer,
    reactionListTopContainer,
    swipeContentContainer,
    wrapper,
  ]);
};
