import React, { useEffect, useMemo, useRef } from 'react';
import {
  I18nManager,
  Platform,
  Pressable,
  StyleSheet,
  StyleProp,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedStyle,
  clamp,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortalHost } from 'react-native-teleport';

import { ClosingPortalHostsLayer } from './ClosingPortalHostsLayer';

import { useA11yLabel } from '../../a11y/hooks/useA11yLabel';
import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';
import { useScreenOrientation } from '../../hooks';
import {
  closeOverlay,
  finalizeCloseOverlay,
  registerOverlaySharedValueController,
  Rect,
  useOverlayController,
} from '../../state-store';
import { useComponentsContext } from '../componentsContext/ComponentsContext';
import { useTheme } from '../themeContext/ThemeContext';

const DURATION = 300;

export const DefaultMessageOverlayBackground = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return (
    <View pointerEvents='none' style={StyleSheet.absoluteFill}>
      <View
        pointerEvents='none'
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: semantics.badgeBgOverlay,
          },
        ]}
      />
    </View>
  );
};

export type MessageActionsProps = {
  bottomItemStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  hostStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  portalHostStyle: StyleProp<ViewStyle>;
  topItemStyle: StyleProp<AnimatedStyle<ViewStyle>>;
};

export const MessageOverlayHostLayer = () => {
  const { MessageActions, MessageOverlayBackground } = useComponentsContext();
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

  const announce = useAccessibilityAnnouncer();
  const overlayOpenHint = useA11yLabel('a11y/Swipe right to go through different actions');
  const announcedOpenRef = useRef(false);
  useEffect(() => {
    if (isActive) {
      if (overlayOpenHint && !announcedOpenRef.current) {
        announce(overlayOpenHint, 'polite');
        announcedOpenRef.current = true;
      }
    } else {
      announcedOpenRef.current = false;
    }
  }, [isActive, overlayOpenHint, announce]);

  // When orientation changes, we dismiss the overlay. While it is possible
  // (and I have a working PoC of) a repositioning solution, it is pretty
  // complex and probably bug prone. This is anyway how the iOS native contextual
  // menu works (as seen on iMessage and Twitch for example, which support landscape
  // mode).
  const orientation = useScreenOrientation();
  const prevOrientationRef = useRef(orientation);
  useEffect(() => {
    if (prevOrientationRef.current === orientation) {
      return;
    }
    prevOrientationRef.current = orientation;
    finalizeCloseOverlay();
  }, [orientation]);

  const padding = 8;
  const minY = topInset + padding;
  const maxY = screenH - bottomInset - padding;

  // Scrollability: when the reaction picker + message + action list are taller than the
  // available space, the message becomes scrollable between a pinned top item and a sticky
  // footer. We do NOT use a ScrollView; instead a Pan gesture drives `scrollY` (a shared
  // value) and the message content is translated by `-scrollY` inside a clipped frame,
  // with `withDecay` momentum. Everything stays on the UI thread, consistent with the rest
  // of this host. All of it is gated on `isActive`, so nothing is mounted when idle.
  const scrollY = useSharedValue(0);
  const scrollStartY = useSharedValue(0);

  const scrollGeom = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) {
      return { needsScroll: false };
    }
    // Scroll kicks in when the reaction picker + message + action list don't fit the usable
    // area (the footer must stay above the safe area).
    const available = maxY - minY;
    const contentH = topH.value.h + messageH.value.h + bottomH.value.h;
    return { needsScroll: contentH > available };
  });

  // Furthest the message can scroll: exactly the amount by which the content overflows the
  // usable area. At max scroll the message tail lands on top of the sticky footer
  // (`maxY - bottomH`). This is independent of the clip-frame height, so the message can run
  // edge-to-edge into the safe area while scrolling still stops in the right place.
  const maxScroll = useDerivedValue(() => {
    if (!scrollGeom.value.needsScroll || !messageH.value || !topH.value || !bottomH.value) {
      return 0;
    }
    const available = maxY - minY;
    const contentH = topH.value.h + messageH.value.h + bottomH.value.h;
    return Math.max(0, contentH - available);
  });

  // Keep the scroll position deterministic. While closing, rewind to the top with the SAME
  // spring the frame uses so the message slides back into its row as one coordinated motion
  // (no jump). Hard-reset once fully closed, ready for the next open.
  useEffect(() => {
    if (closing) {
      scrollY.value = withSpring(0, { duration: DURATION });
    } else if (!isActive) {
      scrollY.value = 0;
    }
  }, [closing, isActive, scrollY]);

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

  const OverlayBackground = MessageOverlayBackground;

  const messageShiftY = useDerivedValue(() => {
    if (!messageH.value || !topH.value || !bottomH.value) return 0;

    const anchorY = messageH.value.y;
    const msgH = messageH.value.h;
    const minTop = minY + topH.value.h;

    // When scrolling, the message clip frame pins directly under the (pinned) top item;
    // the message itself scrolls within that frame via the ScrollView.
    if (scrollGeom.value.needsScroll) {
      return minTop - anchorY;
    }

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

    // When scrolling, the bottom item is a sticky footer pinned to the bottom of the
    // viewport. The ScrollView content carries `bottomH` of trailing padding so the tail
    // of the message clears the footer once fully scrolled.
    if (scrollGeom.value.needsScroll) {
      return maxY - bottomH.value.h - bottomH.value.y;
    }

    const maxMessageTopWithBottom = maxY - (msgH + bottomH.value.h);
    const canFitBottomWithoutOverlap = minMessageTop <= maxMessageTopWithBottom;
    const solvedMessageTop = canFitBottomWithoutOverlap
      ? clamp(anchorMessageTop, minMessageTop, Math.max(minMessageTop, maxMessageTopWithBottom))
      : minMessageTop;

    const solvedBottomTop = Math.min(solvedMessageTop + msgH, maxY - bottomH.value.h);
    return solvedBottomTop - bottomH.value.y;
  });

  const topItemStyle = useAnimatedStyle(() => {
    if (!topH.value) return { opacity: 0, height: 0, width: 0 };
    const translateY = isActive ? (closing ? closeCorrectionY.value : messageShiftY.value) : 0;
    const horizontalPosition = I18nManager.isRTL ? { right: topH.value.x } : { left: topH.value.x };
    return {
      height: topH.value.h,
      opacity: 1,
      position: 'absolute',
      top: topH.value.y,
      transform: [
        { scale: backdrop.value },
        { translateY: withSpring(translateY, { duration: DURATION }) },
      ],
      width: topH.value.w,
      ...horizontalPosition,
    };
  });

  const bottomItemStyle = useAnimatedStyle(() => {
    if (!bottomH.value) return { opacity: 0, height: 0, width: 0 };
    const translateY = isActive ? (closing ? closeCorrectionY.value : bottomShiftY.value) : 0;
    const horizontalPosition = I18nManager.isRTL
      ? { right: bottomH.value.x }
      : { left: bottomH.value.x };
    return {
      height: bottomH.value.h,
      opacity: 1,
      position: 'absolute',
      top: bottomH.value.y,
      transform: [
        { scale: backdrop.value },
        { translateY: withSpring(translateY, { duration: DURATION }) },
      ],
      width: bottomH.value.w,
      ...horizontalPosition,
    };
  });

  // The message host. There is NO clipping: the message is rendered BEHIND the (opaque) top
  // and bottom items, so a scrolled/overflowing message simply passes behind them and flows
  // into the safe areas — exactly like the action list already lets it. Two translateY
  // transforms compose: the first is the springed open/close positioning; the second is the
  // direct, un-springed scroll offset driven by the pan gesture.
  const hostStyle = useAnimatedStyle(() => {
    if (!messageH.value) return { height: 0 };
    const translateY = isActive ? (closing ? closeCorrectionY.value : messageShiftY.value) : 0;
    const scroll = scrollGeom.value.needsScroll ? scrollY.value : 0;
    return {
      height: messageH.value.h,
      left: messageH.value.x,
      position: 'absolute',
      top: messageH.value.y,
      transform: [
        { translateY: withSpring(translateY, { duration: DURATION }) },
        { translateY: scroll === 0 ? 0 : -scroll },
      ],
      width: messageH.value.w,
    };
  });

  // Manual scroller for the message. Drags translate `scrollY` (clamped to the scrollable
  // range); release flings with `withDecay`. When the content fits, `maxScroll` is 0 so the
  // clamp keeps `scrollY` at 0 and the drag is an effective no-op.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => {
          scrollStartY.value = scrollY.value;
        })
        .onUpdate((e) => {
          scrollY.value = clamp(scrollStartY.value - e.translationY, 0, maxScroll.value);
        })
        .onEnd((e) => {
          scrollY.value = withDecay({ clamp: [0, maxScroll.value], velocity: -e.velocityY });
        }),
    [maxScroll, scrollStartY, scrollY],
  );

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
        })
        .requireExternalGestureToFail(pan),
    [bottomH, bottomShiftY, messageShiftY, pan, topH],
  );

  return (
    <GestureDetector gesture={tap}>
      <View
        accessibilityViewIsModal={isActive}
        pointerEvents='box-none'
        style={StyleSheet.absoluteFill}
      >
        {isActive ? (
          <Animated.View pointerEvents='none' style={[StyleSheet.absoluteFill, backdropStyle]}>
            <OverlayBackground />
          </Animated.View>
        ) : null}

        {/*
          The overlay hosts (and therefore the ScrollView) mount only while an overlay is
          active. `isActive` stays true through the closing animation and only drops on
          `finalizeCloseOverlay`, so the teleported subtrees stay stable for the whole
          open -> closing session and nothing is mounted when idle.
        */}
        <View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
          {isActive ? (
            <>
              <Pressable
                onPress={closeOverlay}
                style={StyleSheet.absoluteFill}
                testID='message-overlay-backdrop'
              />

              {MessageActions ? (
                <MessageActions
                  bottomItemStyle={bottomItemStyle}
                  hostStyle={hostStyle}
                  portalHostStyle={styles.absoluteFill}
                  topItemStyle={topItemStyle}
                />
              ) : (
                <>
                  {/*
                    Order matters: the message is rendered FIRST (lowest z) so it sits BEHIND
                    the opaque top and bottom items. A tall/scrolled message therefore passes
                    behind them and into the safe areas, with no clipping and no cut-off.
                  */}
                  <GestureDetector gesture={pan}>
                    <Animated.View style={hostStyle} testID='message-overlay-message'>
                      <PortalHost name='message-overlay' style={styles.absoluteFill} />
                    </Animated.View>
                  </GestureDetector>

                  <Animated.View style={topItemStyle} testID='message-overlay-top'>
                    <PortalHost name='top-item' style={styles.absoluteFill} />
                  </Animated.View>

                  <Animated.View style={bottomItemStyle} testID='message-overlay-bottom'>
                    <PortalHost name='bottom-item' style={styles.absoluteFill} />
                  </Animated.View>
                </>
              )}
            </>
          ) : null}
        </View>

        <ClosingPortalHostsLayer closeCoverOpacity={closeCoverOpacity} />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  absoluteFill: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
