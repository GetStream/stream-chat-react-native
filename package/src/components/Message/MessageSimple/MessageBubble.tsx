import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  Extrapolation,
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
  },
);

const styles = StyleSheet.create({
  contentWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  swipeContentContainer: {
    position: 'absolute',
  },
});
