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
import { ReactionListTopProps } from './ReactionList/ReactionListTop';

import { MessagesContextValue, useTheme } from '../../../contexts';

import { useStableCallback } from '../../../hooks';
import { NativeHandlers } from '../../../native';

export type MessageBubbleProps = Pick<
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

export const MessageBubble = React.memo(
  ({
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

    const {
      theme: {
        messageSimple: { contentWrapper, swipeContentContainer },
      },
    } = useTheme();

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
            contentWrapper,
            props.messageContentWidth > 0 && shouldRenderAnimatedWrapper
              ? { width: props.messageContentWidth }
              : {},
          ]}
        >
          {shouldRenderAnimatedWrapper ? (
            <AnimatedWrapper
              style={[
                styles.swipeContentContainer,
                swipeContentAnimatedStyle,
                swipeContentContainer,
              ]}
            >
              {MessageSwipeContent ? <MessageSwipeContent /> : null}
            </AnimatedWrapper>
          ) : null}
          <MessageBubble {...messageBubbleProps} setMessageContentWidth={setMessageContentWidth} />
        </View>
      </GestureDetector>
    );
  },
);

const styles = StyleSheet.create({
  contentWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  swipeContentContainer: {
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
  },
});
