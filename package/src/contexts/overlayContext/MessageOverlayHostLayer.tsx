import React, { useEffect, useMemo } from 'react';
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

import { ClosingPortalHostsLayer } from './ClosingPortalHostsLayer';

import {
  closeOverlay,
  finalizeCloseOverlay,
  registerOverlaySharedValueController,
  Rect,
  useOverlayController,
} from '../../state-store';
import { useTheme } from '../themeContext/ThemeContext';

const DURATION = 300;

const DefaultMessageOverlayBackground = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View pointerEvents='none' style={StyleSheet.absoluteFillObject}>
      <View
        pointerEvents='none'
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: semantics.badgeBgOverlay,
          },
        ]}
      />
    </View>
  );
};

type MessageOverlayHostLayerProps = {
  BackgroundComponent?: React.ComponentType;
};

export const MessageOverlayHostLayer = ({ BackgroundComponent }: MessageOverlayHostLayerProps) => {
  const { id, closing } = useOverlayController();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const messageH = useSharedValue<Rect>(undefined);
  const topH = useSharedValue<Rect>(undefined);
  const bottomH = useSharedValue<Rect>(undefined);
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
        setMessageH: (rect) => {
          messageH.value = rect;
        },
        setTopH: (rect) => {
          topH.value = rect;
        },
      }),
    [bottomH, closeCorrectionY, messageH, topH],
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

  const OverlayBackground = BackgroundComponent ?? DefaultMessageOverlayBackground;

  const messageShiftY = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) return 0;

    const anchorY = messageH.value.y;
    const msgH = messageH.value.h;
    const minTop = minY + topH.value.h;
    const maxTopWithBottom = maxY - (msgH + bottomH.value.h);
    const canFitBottomWithoutOverlap = minTop <= maxTopWithBottom;
    const solvedTop = canFitBottomWithoutOverlap
      ? clamp(anchorY, minTop, Math.max(minTop, maxTopWithBottom))
      : minTop;

    return solvedTop - anchorY;
  });

  const bottomShiftY = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) return 0;

    const anchorMessageTop = messageH.value.y;
    const msgH = messageH.value.h;
    const minMessageTop = minY + topH.value.h;
    const maxMessageTopWithBottom = maxY - (msgH + bottomH.value.h);
    const canFitBottomWithoutOverlap = minMessageTop <= maxMessageTopWithBottom;
    const solvedMessageTop = canFitBottomWithoutOverlap
      ? clamp(anchorMessageTop, minMessageTop, Math.max(minMessageTop, maxMessageTopWithBottom))
      : minMessageTop;

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

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .onTouchesDown((e, state) => {
          const t = e.allTouches[0];
          if (!t || !topH || !bottomH) return;

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
        }),
    [bottomH, bottomShiftY, messageShiftY, topH],
  );

  return (
    <GestureDetector gesture={tap}>
      <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
        {isActive ? (
          <Animated.View
            pointerEvents='none'
            style={[StyleSheet.absoluteFillObject, backdropStyle]}
          >
            <OverlayBackground />
          </Animated.View>
        ) : null}

        <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
          {isActive ? (
            <Pressable
              onPress={closeOverlay}
              style={StyleSheet.absoluteFillObject}
              testID='message-overlay-backdrop'
            />
          ) : null}

          <Animated.View style={[topItemStyle, topItemTranslateStyle]} testID='message-overlay-top'>
            <PortalHost name='top-item' style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <Animated.View
            pointerEvents='box-none'
            style={[hostStyle, hostTranslateStyle]}
            testID='message-overlay-message'
          >
            <PortalHost name='message-overlay' style={StyleSheet.absoluteFillObject} />
          </Animated.View>

          <Animated.View
            style={[bottomItemStyle, bottomItemTranslateStyle]}
            testID='message-overlay-bottom'
          >
            <PortalHost name='bottom-item' style={StyleSheet.absoluteFillObject} />
          </Animated.View>
        </View>

        <ClosingPortalHostsLayer closeCoverOpacity={closeCoverOpacity} />
      </View>
    </GestureDetector>
  );
};
