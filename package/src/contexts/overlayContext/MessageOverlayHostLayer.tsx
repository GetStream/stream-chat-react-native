import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost } from 'react-native-teleport';

import { closeOverlay, useOverlayController } from '../../state-store';
import { finalizeCloseOverlay } from '../../state-store';

export const MessageOverlayHostLayer = () => {
  const { messageH, topH, bottomH, id, closing } = useOverlayController();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const topInset = insets.top;
  const bottomInset = insets.bottom;

  const isActive = !!id;

  const padding = 8;
  const minY = topInset + padding;
  const maxY = screenH - bottomInset - padding;

  const backdrop = useSharedValue(0);

  useEffect(() => {
    const target = isActive && !closing ? 1 : 0;
    backdrop.value = withTiming(target, { duration: 150 });
  }, [isActive, closing, backdrop]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const shiftY = useDerivedValue(() => {
    if (!messageH?.value || !topH?.value || !bottomH?.value) return 0;

    const anchorY = messageH.value.y;
    const msgH = messageH.value.h;

    const minTop = minY + topH.value.h;
    const maxTop = maxY - (msgH + bottomH.value.h);

    const solvedTop = clamp(anchorY, minTop, maxTop);
    return solvedTop - anchorY;
  });

  const viewportH = useSharedValue(screenH);
  useEffect(() => {
    viewportH.value = screenH;
  }, [screenH, viewportH]);

  const scrollY = useSharedValue(0);
  const initialScrollOffset = useSharedValue(0);

  useEffect(() => {
    if (isActive) scrollY.value = 0;
  }, [isActive, scrollY]);

  const contentH = useDerivedValue(() =>
    topH?.value && bottomH?.value && messageH?.value
      ? Math.max(
          screenH,
          topH.value.h + messageH.value.h + bottomH.value.h + topInset + bottomInset + 20,
        )
      : 0,
  );

  const maxScroll = useDerivedValue(() => Math.max(0, contentH.value - viewportH.value));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .failOffsetX([-12, 12])
        .onBegin(() => {
          cancelAnimation(scrollY);
          initialScrollOffset.value = scrollY.value;
        })
        .onUpdate((e) => {
          scrollY.value = clamp(initialScrollOffset.value + e.translationY, 0, maxScroll.value);
        })
        .onEnd((e) => {
          scrollY.value = withDecay({ clamp: [0, maxScroll.value], velocity: e.velocityY });
        }),
    [initialScrollOffset, maxScroll, scrollY],
  );

  const scrollAtClose = useSharedValue(0);

  useDerivedValue(() => {
    if (closing) {
      scrollAtClose.value = scrollY.value;
      cancelAnimation(scrollY);
    }
  }, [closing]);

  const closeCompStyle = useAnimatedStyle(() => {
    const target = closing ? -scrollAtClose.value : 0;
    return {
      transform: [{ translateY: withTiming(target, { duration: 150 }) }],
    };
  }, [closing]);

  const topItemStyle = useAnimatedStyle(() => {
    if (!topH?.value) return { height: 0 };
    return {
      height: topH.value.h,
      left: topH.value.x,
      position: 'absolute',
      top: topH.value.y + scrollY.value,
      width: topH.value.w,
    };
  });

  const topItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;
    return {
      transform: [{ scale: backdrop.value }, { translateY: withTiming(target, { duration: 150 }) }],
    };
  }, [isActive, closing]);

  const bottomItemStyle = useAnimatedStyle(() => {
    if (!bottomH?.value) return { height: 0 };
    return {
      height: bottomH.value.h,
      left: bottomH.value.x,
      position: 'absolute',
      top: bottomH.value.y + scrollY.value,
      width: bottomH.value.w,
    };
  });

  const bottomItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;
    return {
      transform: [{ scale: backdrop.value }, { translateY: withTiming(target, { duration: 150 }) }],
    };
  }, [isActive, closing]);

  const hostStyle = useAnimatedStyle(() => {
    if (!messageH?.value) return { height: 0 };
    return {
      height: messageH.value.h,
      left: messageH.value.x,
      position: 'absolute',
      top: messageH.value.y + scrollY.value, // layout scroll (no special msg-only compensation)
      width: messageH.value.w,
    };
  });

  const hostTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? 0 : shiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withTiming(target, { duration: 150 }, (finished) => {
            if (finished && closing) {
              runOnJS(finalizeCloseOverlay)();
            }
          }),
        },
      ],
    };
  }, [isActive, closing]);

  const contentStyle = useAnimatedStyle(() => ({
    height: contentH.value,
  }));

  const tap = Gesture.Tap()
    .onTouchesDown((e, state) => {
      const t = e.allTouches[0];
      if (!t) return;

      const x = t.x;
      const y = t.y;

      const yShift = shiftY.value; // overlay shift
      const yParent = scrollY.value; // parent content

      const top = topH?.value;
      if (top) {
        // top rectangle's final screen Y
        // base layout Y + overlay shift (shiftY) + parent scroll transform (scrollY)
        const topY = top.y + yParent + yShift;
        if (x >= top.x && x <= top.x + top.w && y >= topY && y <= topY + top.h) {
          state.fail();
          return;
        }
      }

      const bot = bottomH?.value;
      if (bot) {
        // bottom rectangle's final screen Y
        // base layout Y + overlay shift (shiftY) + parent scroll transform (scrollY)
        const botY = bot.y + yParent + yShift;
        if (x >= bot.x && x <= bot.x + bot.w && y >= botY && y <= botY + bot.h) {
          state.fail();
          return;
        }
      }
    })
    .onEnd(() => {
      runOnJS(closeOverlay)();
    });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
        {isActive ? (
          <Animated.View
            pointerEvents='box-none'
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }, backdropStyle]}
          />
        ) : null}

        <Animated.View style={[contentStyle, closeCompStyle]}>
          {isActive ? (
            <Pressable onPress={closeOverlay} style={StyleSheet.absoluteFillObject} />
          ) : null}

          <Animated.View style={[topItemStyle, topItemTranslateStyle, styles.shadow3]}>
            <PortalHost name='top-item' style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <Animated.View pointerEvents='box-none' style={[hostStyle, hostTranslateStyle]}>
            <PortalHost name='message-overlay' style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <Animated.View style={[bottomItemStyle, bottomItemTranslateStyle, styles.shadow3]}>
            <PortalHost name='bottom-item' style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  shadow3: {
    overflow: 'visible',
    ...Platform.select({
      android: {
        elevation: 3,
        // helps on newer Android (API 28+) to tint elevation shadow
        shadowColor: '#000000',
      },
      ios: {
        shadowColor: 'white',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },
});
