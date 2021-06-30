import React, { useEffect } from 'react';
import { Keyboard, SafeAreaView, StyleSheet, Text, View, ViewStyle } from 'react-native';
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
import {
  Avatar,
  CircleClose,
  MessageIcon,
  useChatContext,
  User,
  UserMinus,
  useTheme,
  vh,
} from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../context/UserInfoOverlayContext';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
} from '../types';

dayjs.extend(relativeTime);

const avatarSize = 64;

const permissions = ['admin', 'moderator'];

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
    marginHorizontal: 8,
    paddingBottom: 24,
    paddingTop: 16,
    width: 64,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingTop: 4,
    textAlign: 'center',
  },
});

const screenHeight = vh(100);
const halfScreenHeight = vh(50);

export type UserInfoOverlayProps = {
  overlayOpacity: Animated.SharedValue<number>;
  visible?: boolean;
};

export const UserInfoOverlay = (props: UserInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;

  const { overlay, setOverlay } = useAppOverlayContext();
  const { client } = useChatContext<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  >();
  const { setData } = useBottomSheetOverlayContext();
  const { data, reset } = useUserInfoOverlayContext();

  const { channel, member, navigation } = data || {};

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

  const self = channel
    ? Object.values(channel.state.members).find(
        (channelMember) => channelMember.user?.id === client.user?.id,
      )
    : undefined;

  if (!self || !member) {
    return null;
  }

  const memberModifiable = permissions.every(
    (permission) => (member.role || '').toLowerCase() !== permission,
  );
  const modifyingPermissions =
    (permissions.some((permission) => (self.role || '').toLowerCase() === permission) &&
      memberModifiable) ||
    memberModifiable;

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
                style={[styles.containerInner, { backgroundColor: white }, showScreenStyle]}
              >
                <SafeAreaView>
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
                          <Avatar
                            image={member.user?.image}
                            name={member.user?.name || member.user?.id}
                            online={member.user?.online}
                            presenceIndicatorContainerStyle={styles.avatarPresenceIndicator}
                            size={avatarSize}
                          />
                        </View>
                      </View>
                      <TapGestureHandler
                        onHandlerStateChange={async ({ nativeEvent: { state } }) => {
                          if (state === State.END) {
                            if (!client.user?.id) return;

                            const members = [client.user.id, member.user?.id || ''];

                            // Check if the channel already exists.
                            const channels = await client.queryChannels({
                              distinct: true,
                              members,
                            });

                            const newChannel =
                              channels.length === 1
                                ? channels[0]
                                : client.channel('messaging', {
                                    members,
                                  });
                            setOverlay('none');
                            if (navigation) {
                              navigation.navigate('OneOnOneChannelDetailScreen', {
                                channel: newChannel,
                              });
                            }
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.row,
                            {
                              borderTopColor: border,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <User pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>View info</Text>
                        </View>
                      </TapGestureHandler>
                      <TapGestureHandler
                        onHandlerStateChange={async ({ nativeEvent: { state } }) => {
                          if (state === State.END) {
                            if (!client.user?.id) return;

                            const members = [client.user.id, member.user?.id || ''];

                            // Check if the channel already exists.
                            const channels = await client.queryChannels({
                              distinct: true,
                              members,
                            });

                            const newChannel =
                              channels.length === 1
                                ? channels[0]
                                : client.channel('messaging', {
                                    members,
                                  });

                            setOverlay('none');
                            if (navigation) {
                              navigation.navigate('ChannelScreen', {
                                channel: newChannel,
                                channelId: newChannel.id,
                              });
                            }
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.row,
                            {
                              borderTopColor: border,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <MessageIcon pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>Message</Text>
                        </View>
                      </TapGestureHandler>
                      {modifyingPermissions ? (
                        <TapGestureHandler
                          onHandlerStateChange={({ nativeEvent: { state } }) => {
                            if (state === State.END) {
                              setData({
                                confirmText: 'REMOVE',
                                onConfirm: () => {
                                  if (member.user?.id) {
                                    channel.removeMembers([member.user.id]);
                                  }
                                  setOverlay('none');
                                },
                                subtext: `Are you sure you want to remove User from ${
                                  channel?.data?.name || 'group'
                                }?`,
                                title: 'Remove User',
                              });
                              setOverlay('confirmation');
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.row,
                              {
                                borderTopColor: border,
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
                        </TapGestureHandler>
                      ) : null}
                      <TapGestureHandler
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                          if (state === State.END) {
                            setOverlay('none');
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.lastRow,
                            {
                              borderBottomColor: border,
                              borderTopColor: border,
                            },
                          ]}
                        >
                          <View style={styles.rowInner}>
                            <CircleClose pathFill={grey} />
                          </View>
                          <Text style={[styles.rowText, { color: black }]}>Cancel</Text>
                        </View>
                      </TapGestureHandler>
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
