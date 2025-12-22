import React, { useMemo } from 'react';
import { LayoutAnimation, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const clamp = (v: number, min: number, max: number) => {
  'worklet';
  return Math.max(min, Math.min(v, max));
};

export function MessageOverlayBundle({
  active,
  rect,
  isMyMessage,
  dismiss,
  overlayColor,
  children, // MessageSimple
}: {
  active: boolean;
  rect: { x: number; y: number; w: number; h: number } | null;
  isMyMessage: boolean;
  dismiss: () => void;
  overlayColor: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const topH = useSharedValue(0);
  const bottomH = useSharedValue(0);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: 1250,
      easing: Easing.out(Easing.cubic),
    });
  }, [active, progress]);

  const padding = 8;
  const minY = insets.top + padding;
  const maxY = screenH - insets.bottom - padding;

  const shiftY = useDerivedValue(() => {
    if (!active || !rect) return 0;

    const anchorY = rect.y;
    const msgH = rect.h;

    const minTop = minY + topH.value;
    const maxTop = maxY - (msgH + bottomH.value);

    // you said: assume it can fit
    const solvedTop = clamp(anchorY, minTop, maxTop);
    return solvedTop - anchorY;
  });

  const shiftYStatic = useMemo(() => {
    if (!active || !rect) return 0;

    const anchorY = rect.y;
    const msgH = rect.h;

    const minTop = minY + topH.value;
    const maxTop = maxY - (msgH + bottomH.value);

    // you said: assume it can fit
    const solvedTop = clamp(anchorY, minTop, maxTop);
    return solvedTop - anchorY;
  }, [active, bottomH.value, maxY, minY, rect, topH.value]);

  const [shift, setShift] = React.useState(0);

  React.useEffect(() => {
    if (!active || !rect) {
      setShift(0);
      return;
    }

    const anchorY = rect.y;
    const msgH = rect.h;

    const minTop = minY + topH.value;
    const maxTop = maxY - (msgH + bottomH.value);

    // you said: assume it can fit
    const solvedTop = clamp(anchorY, minTop, maxTop);
    const nextShift = solvedTop - anchorY;

    // animate the layout change
    LayoutAnimation.configureNext({
      duration: 220,
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.85,
      },
    });

    setShift(nextShift);
  }, [active, bottomH.value, maxY, minY, rect, topH.value]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const wrapperStyle = useAnimatedStyle(() => {
    // if (!rect) return {};
    // animate only the container shift
    return {
      transform: [
        {
          translateY: withTiming(active ? shiftY.value : -shiftY.value, {
            duration: 150,
          }),
        },
      ],
    };
  });

  // if (!rect) {
  //   // inactive: render message inline (portal hostName undefined makes it inline)
  //   // IMPORTANT: still return children so MessageSimple exists and is stable.
  //   return <>{children}</>;
  // }

  console.log('SHIFT: ', shift);

  return (
    <>
      {/* When inactive, this is opacity 0 and basically inert */}
      {active ? (
        <Animated.View
          entering={FadeIn.duration(250).easing(Easing.in(Easing.cubic))}
          exiting={FadeOut.duration(250).easing(Easing.out(Easing.cubic))}
          style={[
            {
              backgroundColor: overlayColor,
              bottom: 0,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            },
            // backdropStyle,
          ]}
        />
      ) : null}

      {/* click outside only when active */}
      {active ? (
        <Pressable
          onPress={dismiss}
          style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
        />
      ) : null}

      {/* The moving container (only one, only for active message) */}
      <View
        pointerEvents='box-none'
        style={
          active
            ? [
                {
                  position: 'absolute',
                  top: rect.y + shift,
                  width: rect.w,
                  ...(isMyMessage ? { right: rect.x } : { left: rect.x }),
                },
                wrapperStyle,
              ]
            : wrapperStyle
        }
      >
        {/* Reactions positioned above the message; height measured */}
        {active ? (
          <Animated.View
            entering={FadeIn.duration(ANIMATED_DURATION).easing(Easing.in(Easing.cubic))}
            exiting={FadeOut.duration(ANIMATED_DURATION).easing(Easing.out(Easing.cubic))}
            onLayout={(e) => {
              topH.value = e.nativeEvent.layout.height;
            }}
            style={{ position: 'absolute', left: 0, right: 0, bottom: rect.h }}
          >
            <ReactionList />
          </Animated.View>
        ) : null}

        {/* The message itself: NOT animated; it just rides along as a child */}
        {children}

        {/* Actions below; height measured */}
        {active ? (
          <Animated.View
            entering={FadeIn.duration(ANIMATED_DURATION).easing(Easing.in(Easing.cubic))}
            exiting={FadeOut.duration(ANIMATED_DURATION).easing(Easing.out(Easing.cubic))}
            onLayout={(e) => {
              bottomH.value = e.nativeEvent.layout.height;
            }}
            style={{ position: 'absolute', left: 0, right: 0, top: rect.h }}
          >
            <MessageActions />
          </Animated.View>
        ) : null}
      </View>
    </>
  );
}

const ReactionList = () => <View style={{ backgroundColor: 'red', width: 150, height: 30 }} />;
const MessageActions = () => (
  <View style={{ backgroundColor: 'purple', width: 150, height: 200 }} />
);

const ANIMATED_DURATION = 1000;
