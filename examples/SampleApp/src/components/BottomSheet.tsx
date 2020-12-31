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
import {
  KeyboardCompatibleView,
  useTheme,
  vh,
} from 'stream-chat-react-native/v2';

import { AddMemberBottomSheet } from './AddMemberBottomSheet';
import { ConfirmationBottomSheet } from './ConfirmationBottomSheet';

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
  },
});

export type BottomSheetProps = {
  dismissHandler: () => void;
  overlayOpacity: Animated.SharedValue<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>;
  visible: boolean;
  type?: string;
};

const screenHeight = vh(100);

export const BottomSheet = (props: BottomSheetProps) => {
  const { dismissHandler, overlayOpacity, params, type, visible } = props;

  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  const offsetY = useSharedValue(0);
  const showScreen = useSharedValue(0);
  const translateY = useSharedValue(0);
  const viewHeight = useSharedValue(0);

  const fadeScreen = (show: boolean) => {
    'worklet';
    if (show) {
      offsetY.value = 0;
      translateY.value = 0;
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
        [0, viewHeight.value / 2],
        [1, 0.75],
        Extrapolate.CLAMP,
      );
    },
    onFinish: (evt) => {
      const finalYPosition = evt.translationY + evt.velocityY * 0.1;

      if (finalYPosition > viewHeight.value / 2 && translateY.value > 0) {
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
        translateY: translateY.value > 0 ? translateY.value : 0,
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
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler
            maxDist={32}
            onHandlerStateChange={({ nativeEvent: { state } }) => {
              if (state === State.END) {
                dismissHandler();
              }
            }}
          >
            <Animated.View style={[styles.animatedContainer, panStyle]}>
              <KeyboardCompatibleView keyboardVerticalOffset={0}>
                <TapGestureHandler>
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
                      showScreenStyle,
                      { backgroundColor: white },
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
                </TapGestureHandler>
              </KeyboardCompatibleView>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};
