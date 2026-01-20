import React, { useEffect } from 'react';
import { Keyboard, StyleSheet, Text, View, ViewStyle } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Gesture, GestureDetector, Pressable } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import {
  CircleClose,
  MessageIcon,
  useChatContext,
  User,
  UserMinus,
  useTheme,
  useViewport,
  UserAvatar,
} from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useUserInfoOverlayContext } from '../context/UserInfoOverlayContext';

import { useAppContext } from '../context/AppContext';
import { UserResponse } from 'stream-chat';
import { useUserInfoOverlayActions } from '../hooks/useUserInfoOverlayActions';
import { SafeAreaView } from 'react-native-safe-area-context';

dayjs.extend(relativeTime);

const styles = StyleSheet.create({
  avatarPresenceIndicator: {
    right: 5,
    top: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 4,
  },
  channelStatus: {
    fontSize: 12,
    fontWeight: 'bold',
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
  lastRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row' },
  rowInner: { padding: 16 },
  rowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  userItemContainer: {
    paddingVertical: 16,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingTop: 4,
    textAlign: 'center',
  },
});

export type UserInfoOverlayProps = {
  overlayOpacity: Animated.SharedValue<number>;
  visible?: boolean;
};

export const UserInfoOverlay = (props: UserInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;
  const { chatClient } = useAppContext();
  const { overlay, setOverlay } = useAppOverlayContext();
  const { client } = useChatContext();
  const { data, reset } = useUserInfoOverlayContext();
  const { vh } = useViewport();

  const screenHeight = vh(100);
  const halfScreenHeight = vh(50);

  const { channel, member } = data || {};

  const {
    theme: {
      colors: { accent_red, black, border, grey, white },
    },
  } = useTheme();

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

  const pan = Gesture.Pan()
    .enabled(overlay === 'channelInfo')
    .maxPointers(1)
    .minDistance(10)
    .onBegin(() => {
      cancelAnimation(translateY);
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = offsetY.value + event.translationY;
      overlayOpacity.value = interpolate(
        translateY.value,
        [0, halfScreenHeight],
        [1, 0.75],
        Extrapolation.CLAMP,
      );
    })
    .onEnd((evt) => {
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
    });

  const tap = Gesture.Tap()
    .maxDistance(32)
    .onEnd(() => {
      runOnJS(setOverlay)('none');
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

  const self = channel
    ? Object.values(channel.state.members).find(
        (channelMember) => channelMember.user?.id === client.user?.id,
      )
    : undefined;

  const { viewInfo, messageUser, removeFromGroup, cancel } = useUserInfoOverlayActions();

  if (!self || !member) {
    return null;
  }

  if (!channel) {
    return null;
  }

  const channelCreatorId =
    channel.data && (channel.data.created_by_id || (channel.data.created_by as UserResponse)?.id);

  return (
    <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={pan}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <GestureDetector gesture={tap}>
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
                style={[styles.containerInner, { backgroundColor: white }, showScreenStyle]}
              >
                <SafeAreaView edges={['bottom']}>
                  {channel && (
                    <>
                      <View style={styles.detailsContainer}>
                        <Text numberOfLines={1} style={[styles.channelName, { color: black }]}>
                          {member.user?.name || member.user?.id || ''}
                        </Text>
                        <Text style={[styles.channelStatus, { color: grey }]}>
                          {member.user?.online
                            ? 'Online'
                            : `Last Seen ${dayjs(member.user?.last_active).fromNow()}`}
                        </Text>
                        <View style={styles.userItemContainer}>
                          <UserAvatar
                            user={member.user}
                            size='lg'
                            showBorder
                            showOnlineIndicator={member.user?.online}
                          />
                        </View>
                      </View>
                      <Pressable onPress={viewInfo}>
                        <View
                          style={[
                            styles.row,
                            {
                              borderTopColor: border.surfaceSubtle,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <User pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>View info</Text>
                        </View>
                      </Pressable>
                      <Pressable onPress={messageUser}>
                        <View
                          style={[
                            styles.row,
                            {
                              borderTopColor: border.surfaceSubtle,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <MessageIcon pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>Message</Text>
                        </View>
                      </Pressable>
                      {channelCreatorId === chatClient?.user?.id ? (
                        <Pressable onPress={removeFromGroup}>
                          <View
                            style={[
                              styles.row,
                              {
                                borderTopColor: border.surfaceSubtle,
                              },
                            ]}
                          >
                            <View style={styles.rowInner}>
                              <UserMinus pathFill={accent_red} />
                            </View>
                            <Text style={[styles.rowText, { color: accent_red }]}>
                              Remove From Group
                            </Text>
                          </View>
                        </Pressable>
                      ) : null}
                      <Pressable onPress={cancel}>
                        <View
                          style={[
                            styles.lastRow,
                            {
                              borderBottomColor: border.surfaceSubtle,
                              borderTopColor: border.surfaceSubtle,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <CircleClose pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>Cancel</Text>
                        </View>
                      </Pressable>
                    </>
                  )}
                </SafeAreaView>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
