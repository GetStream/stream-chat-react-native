import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost } from 'react-native-teleport';

import {
  closeOverlay,
  finalizeCloseOverlay,
  registerOverlaySharedValueController,
  Rect,
  useOverlayController,
} from '../../state-store';

const DURATION = 300;
export const MessageOverlayHostLayer = () => {
  const { id, closing } = useOverlayController();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const messageH = useSharedValue<Rect>(undefined);
  const topH = useSharedValue<Rect>(undefined);
  const bottomH = useSharedValue<Rect>(undefined);
  const composerH = useSharedValue(0);
  const closeCorrectionY = useSharedValue(0);

  const topInset = insets.top;
  // Due to edge-to-edge in combination with various libraries, Android sometimes reports
  // the insets to be 0. If that's the case, we use this as an escape hatch to offset the bottom
  // of the overlay so that it doesn't collide with the navigation bar. Worst case scenario,
  // if the navigation bar is actually 0 - we end up animating a little bit further.
  const bottomInset = insets.bottom === 0 && Platform.OS === 'android' ? 60 : insets.bottom;

  const isActive = !!id;

  const padding = 8;
  const minY = topInset + padding;
  const maxY = screenH - bottomInset - padding;

  const backdrop = useSharedValue(0);
  const closeCoverOpacity = useSharedValue(0);

  useEffect(
    () =>
      registerOverlaySharedValueController({
        incrementCloseCorrectionY: (deltaY) => {
          closeCorrectionY.value += deltaY;
        },
        resetCloseCorrectionY: () => {
          closeCorrectionY.value = 0;
        },
        reset: () => {
          messageH.value = undefined;
          topH.value = undefined;
          bottomH.value = undefined;
          closeCorrectionY.value = 0;
        },
        setBottomH: (rect) => {
          bottomH.value = rect;
        },
        setComposerH: (height) => {
          composerH.value = height;
        },
        setMessageH: (rect) => {
          messageH.value = rect;
        },
        setTopH: (rect) => {
          topH.value = rect;
        },
      }),
    [bottomH, closeCorrectionY, composerH, messageH, topH],
  );

  useEffect(() => {
    const target = isActive && !closing ? 1 : 0;
    backdrop.value = withSpring(target, { duration: DURATION + target * 100 }, (finished) => {
      if (finished && closing) {
        runOnJS(finalizeCloseOverlay)();
      }
    });
    closeCoverOpacity.value = withSpring(closing ? 1 : 0, { duration: DURATION });
  }, [isActive, closing, backdrop, closeCoverOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));
  const closeCoverStyle = useAnimatedStyle(() => ({
    opacity: closeCoverOpacity.value,
  }));
  const composerSlotStyle = useAnimatedStyle(() => ({
    height: composerH.value,
  }));

  const messageShiftY = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) return 0;

    const anchorY = messageH.value.y;
    const msgH = messageH.value.h;
    const minTop = minY + topH.value.h;
    const maxTopWithBottom = maxY - (msgH + bottomH.value.h);
    const maxTopWithoutBottom = maxY - msgH;
    const maxTop = minTop <= maxTopWithBottom ? maxTopWithBottom : maxTopWithoutBottom;
    const solvedTop = clamp(anchorY, minTop, Math.max(minTop, maxTop));

    return solvedTop - anchorY;
  });

  const bottomShiftY = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) return 0;

    const anchorMessageTop = messageH.value.y;
    const msgH = messageH.value.h;
    const minMessageTop = minY + topH.value.h;
    const maxMessageTopWithBottom = maxY - (msgH + bottomH.value.h);
    const maxMessageTopWithoutBottom = maxY - msgH;
    const maxMessageTop =
      minMessageTop <= maxMessageTopWithBottom
        ? maxMessageTopWithBottom
        : maxMessageTopWithoutBottom;
    const solvedMessageTop = clamp(
      anchorMessageTop,
      minMessageTop,
      Math.max(minMessageTop, maxMessageTop),
    );

    const solvedBottomTop = Math.min(solvedMessageTop + msgH, maxY - bottomH.value.h);
    return solvedBottomTop - bottomH.value.y;
  });

  const topItemStyle = useAnimatedStyle(() => {
    if (!topH.value) return { height: 0 };
    return {
      height: topH.value.h,
      left: topH.value.x,
      position: 'absolute',
      top: topH.value.y,
      width: topH.value.w,
    };
  });

  const topItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? closeCorrectionY.value : messageShiftY.value) : 0;
    return {
      transform: [
        { scale: backdrop.value },
        { translateY: withSpring(target, { duration: DURATION }) },
      ],
    };
  }, [isActive, closing]);

  const bottomItemStyle = useAnimatedStyle(() => {
    if (!bottomH.value) return { height: 0 };
    return {
      height: bottomH.value.h,
      left: bottomH.value.x,
      position: 'absolute',
      top: bottomH.value.y,
      width: bottomH.value.w,
    };
  });

  const bottomItemTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? closeCorrectionY.value : bottomShiftY.value) : 0;
    return {
      transform: [
        { scale: backdrop.value },
        { translateY: withSpring(target, { duration: DURATION }) },
      ],
    };
  }, [isActive, closing]);

  const hostStyle = useAnimatedStyle(() => {
    if (!messageH.value) return { height: 0 };
    return {
      height: messageH.value.h,
      left: messageH.value.x,
      position: 'absolute',
      top: messageH.value.y,
      width: messageH.value.w,
    };
  });

  const hostTranslateStyle = useAnimatedStyle(() => {
    const target = isActive ? (closing ? closeCorrectionY.value : messageShiftY.value) : 0;

    return {
      transform: [
        {
          translateY: withSpring(target, { duration: DURATION }),
        },
      ],
    };
  }, [isActive, closing]);

  const tap = Gesture.Tap()
    .onTouchesDown((e, state) => {
      const t = e.allTouches[0];
      if (!t) return;

      const x = t.x;
      const y = t.y;

      const messageYShift = messageShiftY.value; // overlay shift for top + message
      const bottomYShift = bottomShiftY.value; // overlay shift for bottom
      const top = topH.value;
      if (top) {
        const topY = top.y + messageYShift;
        if (x >= top.x && x <= top.x + top.w && y >= topY && y <= topY + top.h) {
          state.fail();
          return;
        }
      }

      const bot = bottomH.value;
      if (bot) {
        const botY = bot.y + bottomYShift;
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
    <GestureDetector gesture={tap}>
      <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
        {isActive ? (
          <Animated.View
            pointerEvents='box-none'
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000CC' }, backdropStyle]}
          />
        ) : null}

        <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
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
        </View>

        <Animated.View pointerEvents='box-none' style={[styles.overlayHeaderSlot, closeCoverStyle]}>
          <PortalHost name='overlay-header' style={StyleSheet.absoluteFillObject} />
        </Animated.View>

        <Animated.View
          pointerEvents='box-none'
          style={[styles.overlayComposerSlot, closeCoverStyle, composerSlotStyle]}
        >
          <PortalHost name='overlay-composer' style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  overlayComposerSlot: {
    bottom: 0,
    elevation: 20,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 20,
  },
  overlayHeaderSlot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    left: 0,
    position: 'absolute',
    right: 0,
  },
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
