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
import {
  Avatar,
  CircleClose,
  Delete,
  StreamCache,
  User,
  UserMinus,
  useTheme,
  useToastContext,
  useTranslationContext,
  vh,
  vw,
} from 'stream-chat-react-native';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';

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
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row' },
  rowInner: { paddingLeft: 16, paddingRight: 10, paddingVertical: 20 },
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

const screenHeight = vh(100);
const halfScreenHeight = vh(50);
const width = vw(100) - 60;

export type ChannelInfoOverlayProps = {
  overlayOpacity: Animated.SharedValue<number>;
  visible?: boolean;
};

export const ChannelInfoOverlay = (props: ChannelInfoOverlayProps) => {
  const { overlayOpacity, visible } = props;

  const toast = useToastContext();
  const { t } = useTranslationContext();

  const { overlay, setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();
  const { data, reset } = useChannelInfoOverlayContext();

  const { channel, clientId, navigation } = data || {};

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

  // magic number 8 used as fontSize is 16 so assuming average character width of half
  const maxWidth = channel
    ? Math.floor(width / 8 - Object.keys(channel.state.members || {}).length.toString().length)
    : 0;
  const channelName = channel
    ? channel.data?.name ||
      Object.values(channel.state.members)
        .slice(0)
        .reduce((returnString, currentMember, index, originalArray) => {
          const returnStringLength = returnString.length;
          const currentMemberName =
            currentMember.user?.name || currentMember.user?.id || 'Unknown User';
          // a rough approximation of when the +Number shows up
          if (returnStringLength + (currentMemberName.length + 2) < maxWidth) {
            if (returnStringLength) {
              returnString += `, ${currentMemberName}`;
            } else {
              returnString = currentMemberName;
            }
          } else {
            const remainingMembers = originalArray.length - index;
            returnString += `, +${remainingMembers}`;
            originalArray.splice(1); // exit early
          }
          return returnString;
        }, '')
    : '';
  const otherMembers = channel
    ? Object.values(channel.state.members).filter((member) => member.user?.id !== clientId)
    : [];

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
                          {channelName}
                        </Text>
                        <Text style={[styles.channelStatus, { color: grey }]}>
                          {otherMembers.length === 1
                            ? otherMembers[0].user?.online
                              ? 'Online'
                              : `Last Seen ${dayjs(otherMembers[0].user?.last_active).fromNow()}`
                            : `${Object.keys(channel.state.members).length} Members, ${
                                Object.values(channel.state.members).filter(
                                  (member) => !!member.user?.online,
                                ).length
                              } Online`}
                        </Text>
                        <FlatList
                          contentContainerStyle={styles.flatListContent}
                          data={Object.values(channel.state.members)
                            .map((member) => member.user)
                            .sort((a, b) =>
                              !!a?.online && !b?.online
                                ? -1
                                : a?.id === clientId && b?.id !== clientId
                                ? -1
                                : !!a?.online && !!b?.online
                                ? 0
                                : 1,
                            )}
                          horizontal
                          keyExtractor={(item, index) => `${item?.id}_${index}`}
                          renderItem={({ item }) =>
                            item ? (
                              <View style={styles.userItemContainer}>
                                <Avatar
                                  image={item.image}
                                  name={item.name || item.id}
                                  online={item.online}
                                  presenceIndicatorContainerStyle={styles.avatarPresenceIndicator}
                                  size={avatarSize}
                                />
                                <Text style={[styles.userName, { color: black }]}>
                                  {item.name || item.id || ''}
                                </Text>
                              </View>
                            ) : null
                          }
                          style={styles.flatList}
                        />
                      </View>
                      <TapGestureHandler
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                          if (state === State.END) {
                            setOverlay('none');
                            if (navigation) {
                              if (otherMembers.length === 1) {
                                navigation.navigate('OneOnOneChannelDetailScreen', {
                                  channel,
                                });
                              } else {
                                navigation.navigate('GroupChannelDetailsScreen', {
                                  channel,
                                });
                              }
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
                      {otherMembers.length > 1 && (
                        <TapGestureHandler
                          onHandlerStateChange={({ nativeEvent: { state } }) => {
                            if (!StreamCache.getInstance().currentNetworkState) {
                              toast.show(t('Something went wrong'), 2000);
                            } else {
                              if (state === State.END) {
                                if (clientId) {
                                  channel.removeMembers([clientId]);
                                }
                                setOverlay('none');
                              }
                            }
                          }}
                        >
                          <View style={[styles.row, { borderTopColor: border }]}>
                            <View style={styles.rowInner}>
                              <UserMinus pathFill={grey} />
                            </View>
                            <Text style={[styles.rowText, { color: black }]}>Leave Group</Text>
                          </View>
                        </TapGestureHandler>
                      )}
                      <TapGestureHandler
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                          if (!StreamCache.getInstance().currentNetworkState) {
                            toast.show(t('Something went wrong'), 2000);
                          } else {
                            if (state === State.END) {
                              setData({
                                confirmText: 'DELETE',
                                onConfirm: () => {
                                  channel.delete();
                                  setOverlay('none');
                                },
                                subtext: `Are you sure you want to delete this ${
                                  otherMembers.length === 1 ? 'conversation' : 'group'
                                }?`,
                                title: `Delete ${
                                  otherMembers.length === 1 ? 'Conversation' : 'Group'
                                }`,
                              });
                              setOverlay('confirmation');
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
                            <Delete pathFill={accent_red} />
                          </View>
                          <Text style={[styles.rowText, { color: accent_red }]}>
                            Delete conversation
                          </Text>
                        </View>
                      </TapGestureHandler>
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
