import React, { ReactNode, useMemo, useState } from 'react';
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
import { MessageItemViewPropsWithContext } from './MessageItemView';

import { MessagesContextValue, useTheme } from '../../../contexts';

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
  > &
  Pick<MessageItemViewPropsWithContext, 'alignment'>;

export const MessageBubble = React.memo(
  ({
    alignment,
    reactionListPosition,
    reactionListType,
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

type SwipableMessageWrapperProps = Pick<MessagesContextValue, 'MessageSwipeContent'> &
  Pick<MessageItemViewPropsWithContext, 'alignment' | 'messageSwipeToReplyHitSlop'> & {
    children: ReactNode;
    onSwipe: () => void;
  };

export const SwipableMessageWrapper = React.memo((props: SwipableMessageWrapperProps) => {
  const { MessageSwipeContent, children, messageSwipeToReplyHitSlop, onSwipe } = props;

  const styles = useStyles({ alignment: props.alignment });

  const translateX = useSharedValue(0);
  const touchStart = useSharedValue<{ x: number; y: number } | null>(null);
  const isSwiping = useSharedValue<boolean>(false);
  const [shouldRenderAnimatedWrapper, setShouldRenderAnimatedWrapper] = useState<boolean>(false);

  const SWIPABLE_THRESHOLD = 25;
  const MINIMUM_DISTANCE = 8;

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
      <View hitSlop={messageSwipeToReplyHitSlop} style={styles.contentWrapper}>
        {shouldRenderAnimatedWrapper ? (
          <AnimatedWrapper style={[styles.swipeContentContainer, swipeContentAnimatedStyle]}>
            {MessageSwipeContent ? <MessageSwipeContent /> : null}
          </AnimatedWrapper>
        ) : null}
        {children}
      </View>
    </GestureDetector>
  );
});

const useStyles = ({ alignment }: { alignment?: 'left' | 'right' }) => {
  const {
    theme: {
      messageItemView: {
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
