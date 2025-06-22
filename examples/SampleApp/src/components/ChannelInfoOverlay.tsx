import React, { useEffect } from 'react';
import { FlatList, Keyboard, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
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
  withTiming,
} from 'react-native-reanimated';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';
import { Archive } from '../icons/Archive';
import { Pin } from '../icons/Pin';

dayjs.extend(relativeTime);

const avatarSize = 64;

const styles = StyleSheet.create({
  avatarPresenceIndicator: {
    right: 5,
    top: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 4,
    paddingHorizontal: 30,
  },
  channelStatus: {
    fontSize: 12,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  containerInner: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    width: '100%',
  },
  detailsContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  flatList: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  lastRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 16,
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', paddingVertical: 16 },
  rowInner: { paddingLeft: 16, paddingRight: 10 },
  rowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userItemContainer: { marginHorizontal: 8, width: 64 },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    paddingTop: 4,
    textAlign: 'center',
  },
});

export type ChannelInfoOverlayProps = {
  overlayOpacity: Animated.SharedValue<number>;
  visible?: boolean;
};

export const ChannelInfoOverlay = (props: ChannelInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;

  const { overlay, setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();
  const { data, reset } = useChannelInfoOverlayContext();

  const screenHeight = vh(100);
  const halfScreenHeight = vh(50);
  const width = vw(100) - 60;

  const { channel, clientId, membership, navigation } = data || {};

  const offsetY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const viewHeight = useSharedValue(0);

  const showScreen = useSharedValue(0);
  const fadeScreen = (show: boolean) => {
    'worklet';
    if (show) {
      offsetY.value = 0;
      translateY.value = 0;
    }
    showScreen.value = show
      ? withTiming(1, {
          duration: 150,
          easing: Easing.in(Easing.ease),
        })
      : withTiming(
          0,
          {
            duration: 150,
            easing: Easing.out(Easing.ease),
          },
          () => {
            runOnJS(reset)();
          },
        );
  };

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    }
    fadeScreen(!!visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            runOnJS(setOverlay)('none');
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
        translateY: interpolate(showScreen.value, [0, 1], [viewHeight.value / 2, 0]),
      },
    ],
  }));

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <PanGestureHandler
        enabled={overlay === 'channelInfo'}
        maxPointers={1}
        minDist={10}
        onGestureEvent={onPan}
      >
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <TapGestureHandler
            maxDist={32}
            onHandlerStateChange={({ nativeEvent: { state } }) => {
              if (state === State.END) {
                setOverlay('none');
              }
            }}
          >
            <Animated.View
              onLayout={({
                nativeEvent: {
                  layout: { height },
                },
              }) => {
                viewHeight.value = height;
              }}
              style={[styles.container, panStyle]}
            >
              <Animated.View
                style={[styles.containerInner,  showScreenStyle]}
              >
                <SafeAreaView>
                  {channel && (
                    <>
                      <View style={styles.detailsContainer}>
                        <Text numberOfLines={1} style={[styles.channelName]} />
                        <Text style={[styles.channelStatus]} />
                      </View>
                    </>
                  )}
                </SafeAreaView>
              </Animated.View>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};
