import React, { useEffect } from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
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
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Avatar } from '../Avatar/Avatar';

import {
  ChannelInfoOverlayContextValue,
  ChannelInfoOverlayData,
  useChannelInfoOverlayContext,
} from '../../contexts/channelInfoOverlayContext/ChannelInfoOverlayContext';
import {
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import { Delete } from '../../icons/Delete';
import { UserMinus } from '../../icons/UserMinus';
import { vh, vw } from '../../utils/utils';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

dayjs.extend(relativeTime);

const styles = StyleSheet.create({
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 4,
    paddingHorizontal: 30,
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
  flatList: {
    paddingBottom: 24,
    paddingTop: 16,
  },
  flatListContent: {
    paddingHorizontal: 8,
  },
  row: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row' },
  rowInner: { padding: 16 },
  rowText: {
    fontSize: 14.5,
  },
  userItemContainer: { marginHorizontal: 8, width: 64 },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingTop: 4,
    textAlign: 'center',
  },
});

const screenHeight = vh(100);
const halfScreenHeight = vh(50);
const width = vw(100) - 60;

export type ChannelInfoOverlayPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Pick<ChannelInfoOverlayContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'reset'> &
  Pick<TranslationContextValue, 't'> &
  ChannelInfoOverlayData<At, Ch, Co, Ev, Me, Re, Us> &
  Pick<OverlayContextValue, 'overlay' | 'setOverlay'> & {
    overlayOpacity: Animated.SharedValue<number>;
    visible?: boolean;
  };

const ChannelInfoOverlayWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    clientId,
    overlay,
    overlayOpacity,
    reset,
    setOverlay,
    t,
    visible,
  } = props;

  const {
    theme: {
      channelInfoOverlay: {
        avatarPresenceIndicator,
        avatarPresenceIndicatorStyle,
        avatarSize,
        channelName: channelNameStyle,
        channelStatus,
        container,
        containerInner,
        deleteRow,
        deleteText,
        detailsContainer,
        flatList,
        flatListContent,
        leaveGroupRow,
        leaveGroupText,
        row,
        rowInner,
        userItemContainer,
        userName,
      },
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
              runOnJS(reset)();
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
        translateY: interpolate(
          showScreen.value,
          [0, 1],
          [viewHeight.value / 2, 0],
        ),
      },
    ],
  }));

  // magic number 8 used as fontSize is 16 so assuming average character width of half
  const maxWidth = channel
    ? Math.floor(
        width / 8 -
          Object.keys(channel.state.members || {}).length.toString().length,
      )
    : 0;
  const channelName = channel
    ? channel.data?.name ||
      Object.values(channel.state.members || {})
        .slice(0)
        .reduce((returnString, currentMember, index, originalArray) => {
          const returnStringLength = returnString.length;
          const currentMemberName =
            currentMember.user?.name ||
            currentMember.user?.id ||
            t('Unknown User') ||
            'Unknown User';
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
    ? Object.values(channel.state.members).filter(
        (member) => member.user?.id !== clientId,
      )
    : [];

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={StyleSheet.absoluteFill}
    >
      <PanGestureHandler
        enabled={overlay === 'channelInfo'}
        maxPointers={1}
        minDist={10}
        onGestureEvent={onPan}
      >
        <Animated.View style={[StyleSheet.absoluteFillObject]}>
          <TapGestureHandler
            maxDist={32}
            onHandlerStateChange={({ nativeEvent: { state } }) => {
              if (state === State.END) {
                setOverlay('none');
              }
            }}
          >
            <Animated.View style={[styles.container, container, panStyle]}>
              <Animated.View
                onLayout={({
                  nativeEvent: {
                    layout: { height },
                  },
                }) => {
                  viewHeight.value = height;
                }}
                style={[
                  styles.containerInner,
                  { backgroundColor: white },
                  containerInner,
                  showScreenStyle,
                ]}
              >
                <SafeAreaView>
                  {channel && (
                    <>
                      <View style={[styles.detailsContainer, detailsContainer]}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.channelName,
                            { color: black },
                            channelNameStyle,
                          ]}
                        >
                          {channelName}
                        </Text>
                        <Text
                          style={[
                            styles.channelStatus,
                            { color: grey },
                            channelStatus,
                          ]}
                        >
                          {otherMembers.length === 1
                            ? otherMembers[0].user?.online
                              ? t('Online')
                              : dayjs(
                                  otherMembers[0].user?.last_active,
                                ).fromNow()
                            : t(
                                '{{ channelMembers }} Members, {{ onlineMembers }} Online',
                                {
                                  channelMembers: Object.keys(
                                    channel.state.members,
                                  ).length,
                                  onlineMembers: Object.values(
                                    channel.state.members,
                                  ).filter((member) => !!member.user?.online)
                                    .length,
                                },
                              )}
                        </Text>
                        <FlatList
                          contentContainerStyle={[
                            styles.flatListContent,
                            flatListContent,
                          ]}
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
                              <View
                                style={[
                                  styles.userItemContainer,
                                  userItemContainer,
                                ]}
                              >
                                <Avatar
                                  image={item.image}
                                  name={item.name || item.id}
                                  online={item.online}
                                  presenceIndicator={avatarPresenceIndicator}
                                  presenceIndicatorContainerStyle={
                                    avatarPresenceIndicatorStyle
                                  }
                                  size={avatarSize}
                                />
                                <Text
                                  style={[
                                    styles.userName,
                                    { color: black },
                                    userName,
                                  ]}
                                >
                                  {item.name || item.id || ''}
                                </Text>
                              </View>
                            ) : null
                          }
                          style={[styles.flatList, flatList]}
                        />
                      </View>
                      {otherMembers.length > 1 && (
                        <TapGestureHandler
                          onHandlerStateChange={({
                            nativeEvent: { state },
                          }) => {
                            if (state === State.END) {
                              if (clientId) {
                                channel.removeMembers([clientId]);
                              }
                              setOverlay('none');
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.row,
                              { borderTopColor: border },
                              row,
                              leaveGroupRow,
                            ]}
                          >
                            <View style={[styles.rowInner, rowInner]}>
                              <UserMinus pathFill={grey} />
                            </View>
                            <Text
                              style={[
                                styles.rowText,
                                { color: black },
                                leaveGroupText,
                              ]}
                            >
                              {t('Leave Group')}
                            </Text>
                          </View>
                        </TapGestureHandler>
                      )}
                      <TapGestureHandler
                        onHandlerStateChange={({ nativeEvent: { state } }) => {
                          if (state === State.END) {
                            channel.delete();
                            setOverlay('none');
                          }
                        }}
                      >
                        <View
                          style={[
                            styles.row,
                            {
                              borderBottomColor: border,
                              borderTopColor: border,
                            },
                            row,
                            deleteRow,
                          ]}
                        >
                          <View style={[styles.rowInner, rowInner]}>
                            <Delete pathFill={accent_red} />
                          </View>
                          <Text
                            style={[
                              styles.rowText,
                              { color: accent_red },
                              deleteText,
                            ]}
                          >
                            {t('Delete')}
                          </Text>
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

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel: prevChannel, visible: prevVisible } = prevProps;
  const { channel: nextChannel, visible: nextVisible } = nextProps;

  const visibleEqual = prevVisible === nextVisible;
  if (!visibleEqual) return false;

  const channelEqual =
    (!!prevChannel &&
      !!nextChannel &&
      prevChannel.id === nextChannel.id &&
      prevChannel.data?.name === nextChannel.data?.name &&
      Object.keys(prevChannel.state.members).length ===
        Object.keys(nextChannel.state.members).length &&
      Object.entries(prevChannel.state.members).every(
        ([memberId, member]) =>
          member.user &&
          nextChannel.state.members[memberId].user &&
          member.user.online ===
            nextChannel.state.members[memberId].user?.online,
      )) ||
    prevChannel === nextChannel;
  if (!channelEqual) return false;

  return true;
};

const MemoizedChannelInfoOverlay = React.memo(
  ChannelInfoOverlayWithContext,
  areEqual,
) as typeof ChannelInfoOverlayWithContext;

export type ChannelInfoOverlayProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
> = Partial<
  Omit<
    ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'overlayOpacity'
  >
> &
  Pick<
    ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'overlayOpacity'
  >;

/**
 * ChannelInfoOverlay - A high level component which implements all the logic required for a message overlay
 */
export const ChannelInfoOverlay = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType = DefaultUserType
>(
  props: ChannelInfoOverlayProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel: propChannel,
    clientId: propClientId,
    overlay: propOverlay,
    overlayOpacity,
    reset: propReset,
    setOverlay: propSetOverlay,
    t: propT,
    visible,
  } = props;

  const { data, reset: contextReset } = useChannelInfoOverlayContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const {
    overlay: contextOverlay,
    setOverlay: contextSetOverlay,
  } = useOverlayContext();
  const { t: contextT } = useTranslationContext();

  const { channel: contextChannel, clientId: contextClientId } = data || {};

  const channel = propChannel || contextChannel;
  const clientId = propClientId || contextClientId;
  const overlay = propOverlay || contextOverlay;
  const reset = propReset || contextReset;
  const setOverlay = propSetOverlay || contextSetOverlay;
  const t = propT || contextT;

  return (
    <MemoizedChannelInfoOverlay
      {...{
        channel,
        clientId,
        overlay,
        overlayOpacity,
        reset,
        setOverlay,
        t,
        visible,
      }}
    />
  );
};

ChannelInfoOverlay.displayName = 'ChannelInfoOverlay{channelInfoOverlay}';
