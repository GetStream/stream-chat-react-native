import React, { useEffect } from 'react';
import { Keyboard, StyleSheet, ViewStyle } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardCompatibleView,
  useTheme,
  vh,
  vw,
} from 'stream-chat-react-native/v2';

import { AddMemberBottomSheet } from './AddMemberBottomSheet';
import { ConfirmationBottomSheet } from './ConfirmationBottomSheet';

export type BottomSheetProps = {
  dismissHandler: () => void;
  overlayOpacity: Animated.SharedValue<number>;
  params: Record<string, any>;
  visible: boolean;
  type?: string;
};

const screenHeight = vh(100);
const halfScreenHeight = vh(50);
const width = vw(100) - 60;

export const BottomSheet = (props: BottomSheetProps) => {
  const { dismissHandler, overlayOpacity, params, type, visible } = props;
  const insets = useSafeAreaInsets();

  const offsetY = useSharedValue(0);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const viewHeight = useSharedValue(0);

  const showScreen = useSharedValue(0);

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  const fadeScreen = (show: boolean) => {
    'worklet';
    if (show) {
      offsetY.value = 0;
      translateY.value = 0;
      scale.value = 1;
    }
    showScreen.value = show
      ? withSpring(1, {
          damping: 600,
          mass: 0.5,
          restDisplacementThreshold: 0.01,
          restSpeedThreshold: 0.01,
          stiffness: 200,
          velocity: 32,
        })
      : withTiming(
          0,
          {
            duration: 150,
            easing: Easing.out(Easing.ease),
          },
          () => {
            if (!show) {
              runOnJS(dismissHandler)();
            }
          },
        );
  };

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
    fadeScreen(!!visible);
  }, [visible]);

  const onPan = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (evt) => {
      translateY.value = offsetY.value + evt.translationY;
      overlayOpacity.value = interpolate(
        translateY.value,
        [0, halfScreenHeight],
        [1, 0.75],
        Extrapolate.CLAMP,
      );
      scale.value = interpolate(
        translateY.value,
        [0, halfScreenHeight],
        [1, 0.85],
        Extrapolate.CLAMP,
      );
    },
    onFinish: (evt) => {
      const finalYPosition = evt.translationY + evt.velocityY * 0.1;

      if (finalYPosition > halfScreenHeight && translateY.value > 0) {
        cancelAnimation(translateY);
        overlayOpacity.value = withTiming(
          0,
          {
            duration: 200,
            easing: Easing.out(Easing.ease),
          },
          () => {
            runOnJS(dismissHandler)();
          },
        );
        translateY.value =
          evt.velocityY > 1000
            ? withDecay({
                velocity: evt.velocityY,
              })
            : withTiming(screenHeight, {
                duration: 200,
                easing: Easing.out(Easing.ease),
              });
      } else {
        translateY.value = withTiming(0);
        scale.value = withTiming(1);
        overlayOpacity.value = withTiming(1);
      }
    },
    onStart: () => {
      cancelAnimation(translateY);
      offsetY.value = translateY.value;
    },
  });

  const panStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
    ],
  }));

  const showScreenStyle = useAnimatedStyle<ViewStyle>(() => ({
    transform: [
      {
        translateY: interpolate(
          showScreen.value,
          [0, 1],
          [viewHeight.value / 2, 0],
        ),
      },
      {
        scale: showScreen.value,
      },
    ],
  }));

  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={StyleSheet.absoluteFill}
    >
      <PanGestureHandler
        enabled={visible}
        maxPointers={1}
        minDist={10}
        onGestureEvent={onPan}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject]}>
          <TapGestureHandler
            maxDist={32}
            onHandlerStateChange={({ nativeEvent: { state } }) => {
              if (state === State.END) {
                dismissHandler();
              }
            }}
          >
            <Animated.View
              style={[
                panStyle,
                {
                  flexGrow: 1,
                  flexShrink: 1,
                  justifyContent: 'flex-end',
                },
              ]}
            >
              <KeyboardCompatibleView keyboardVerticalOffset={10}>
                <Animated.View
                  onLayout={({
                    nativeEvent: {
                      layout: { height },
                    },
                  }) => {
                    viewHeight.value = height;
                  }}
                  style={[
                    styles.container,
                    { backgroundColor: white },
                    showScreenStyle,
                  ]}
                >
                  {type === 'addMembers' && (
                    <AddMemberBottomSheet
                      channel={params.channel}
                      dismissHandler={dismissHandler}
                    />
                  )}
                  {type === 'confirmation' && (
                    <ConfirmationBottomSheet
                      {...params}
                      cancelText={params.cancelText}
                      confirmText={params.confirmText}
                      dismissHandler={dismissHandler}
                      onConfirm={params.onConfirm}
                      subtext={params.subtext}
                      title={params.title}
                    />
                  )}
                </Animated.View>
              </KeyboardCompatibleView>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    flexDirection: 'column',
    paddingHorizontal: 16,
    width: '100%',
  },
});
