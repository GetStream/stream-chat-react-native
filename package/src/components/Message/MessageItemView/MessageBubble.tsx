import React, { ReactNode, useMemo, useState } from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { MessageItemViewPropsWithContext } from './MessageItemView';

import { useTheme } from '../../../contexts';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';

import { NativeHandlers } from '../../../native';

const AnimatedWrapper = Animated.createAnimatedComponent(View);

type SwipableMessageWrapperProps = Pick<
  MessageItemViewPropsWithContext,
  'messageSwipeToReplyHitSlop'
> & {
  children: ReactNode;
  onSwipe: () => void;
};

export const SwipableMessageWrapper = React.memo((props: SwipableMessageWrapperProps) => {
  const { children, messageSwipeToReplyHitSlop, onSwipe } = props;
  const { MessageSwipeContent } = useComponentsContext();
  const isRTL = I18nManager.isRTL;
  const swipeDirectionMultiplier = isRTL ? -1 : 1;

  const styles = useStyles();

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
          const swipeDistance = translationX * swipeDirectionMultiplier;
          if (swipeDistance > 0) {
            translateX.value = swipeDistance;
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
    [
      messageSwipeToReplyHitSlop,
      onSwipe,
      swipeDirectionMultiplier,
      touchStart,
      isSwiping,
      translateX,
      triggerHaptic,
    ],
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

const useStyles = () => {
  const {
    theme: {
      messageItemView: { contentWrapper, swipeContentContainer },
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
      swipeContentContainer: {
        ...swipeContentContainer,
      },
    });
  }, [contentWrapper, swipeContentContainer]);
};
