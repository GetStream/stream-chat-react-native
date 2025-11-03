import { type ReactNode, useRef } from 'react';
import Animated, {
  clamp,
  scrollTo,
  useAnimatedRef,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { View } from 'react-native';

export const MarkdownReactiveScrollView = ({
  children,
}: {
  children: ReactNode;
}) => {
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const contentWidth = useSharedValue(0);
  const visibleContentWidth = useSharedValue(0);
  const offsetBeforeScroll = useSharedValue(0);
  const touchStart = useSharedValue<{ x: number; y: number } | null>(null);

  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      touchStart.value = { x: event.x, y: event.y };
    })
    .onTouchesMove((event, state) => {
      if (!touchStart.value || !event.changedTouches.length) {
        state.fail();
        return;
      }

      const xDiff = Math.abs(event.changedTouches[0]!.x - touchStart.value.x);
      const yDiff = Math.abs(event.changedTouches[0]!.y - touchStart.value.y);
      const isHorizontalPanning = xDiff > yDiff;

      if (isHorizontalPanning) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      const { translationX } = event;

      scrollTo(
        scrollViewRef,
        offsetBeforeScroll.value - translationX,
        0,
        false,
      );
    })
    .onEnd((event) => {
      const { translationX } = event;

      const velocityEffect = event.velocityX * 0.3;

      const finalPosition = clamp(
        offsetBeforeScroll.value - translationX - velocityEffect,
        0,
        contentWidth.value - visibleContentWidth.value,
      );

      offsetBeforeScroll.value = finalPosition;

      scrollTo(scrollViewRef, finalPosition, 0, true);
    });

  return (
    <View style={{ width: '100%' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          horizontal
          nestedScrollEnabled={true}
          onContentSizeChange={(width) => {
            contentWidth.value = width;
          }}
          onLayout={(e) => {
            visibleContentWidth.value = e.nativeEvent.layout.width;
          }}
          ref={scrollViewRef}
          scrollEnabled={false}
        >
          {children}
        </Animated.ScrollView>
      </GestureDetector>
    </View>
  );
};
