import React, { useEffect } from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  useSharedValue,
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

import { Delete } from '../../icons/Delete';
import { UserMinus } from '../../icons/UserMinus';
import { vw } from '../../utils/utils';

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
  ChannelInfoOverlayData<At, Ch, Co, Ev, Me, Re, Us> &
  Pick<OverlayContextValue, 'setOverlay'> & {
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
  const { channel, clientId, reset, setOverlay, visible } = props;

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
      colors: { danger },
    },
  } = useTheme();

  const offsetY = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const showScreen = useSharedValue(0);
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
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={StyleSheet.absoluteFill}
    >
      <TapGestureHandler
        maxDist={32}
        onHandlerStateChange={({ nativeEvent: { state } }) => {
          if (state === State.END) {
            setOverlay('none');
          }
        }}
      >
        <View style={[styles.container, container]}>
          {channel && (
            <View style={[styles.containerInner, containerInner]}>
              <SafeAreaView>
                <View style={[styles.detailsContainer, detailsContainer]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.channelName, channelNameStyle]}
                  >
                    {channelName}
                  </Text>
                  <Text style={[styles.channelStatus, channelStatus]}>
                    {otherMembers.length === 1
                      ? otherMembers[0].user?.online
                        ? 'Online'
                        : dayjs(otherMembers[0].user?.last_active).fromNow()
                      : `${
                          Object.keys(channel.state.members).length
                        } Members, ${
                          Object.values(channel.state.members).filter(
                            (member) => !!member.user?.online,
                          ).length
                        } Online`}
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
                    renderItem={({ item }) =>
                      item ? (
                        <View
                          style={[styles.userItemContainer, userItemContainer]}
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
                          <Text style={[styles.userName, userName]}>
                            {item.name || item.id || ''}
                          </Text>
                        </View>
                      ) : null
                    }
                    style={[styles.flatList, flatList]}
                  />
                </View>
                {otherMembers.length > 1 && (
                  <View style={[styles.row, row, leaveGroupRow]}>
                    <View style={[styles.rowInner, rowInner]}>
                      <UserMinus pathFill='#7A7A7A' />
                    </View>
                    <Text style={[styles.rowText, leaveGroupText]}>
                      {'Leave Group'}
                    </Text>
                  </View>
                )}
                <View style={[styles.row, row, deleteRow]}>
                  <View style={[styles.rowInner, rowInner]}>
                    <Delete pathFill={danger} />
                  </View>
                  <Text style={[styles.rowText, deleteText]}>{'Delete'}</Text>
                </View>
              </SafeAreaView>
            </View>
          )}
        </View>
      </TapGestureHandler>
    </View>
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
> = Partial<ChannelInfoOverlayPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

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
    reset: propReset,
    setOverlay: propSetOverlay,
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
  const { setOverlay: contextSetOverlay } = useOverlayContext();

  const { channel: contextChannel, clientId: contextClientId } = data || {};

  const channel = propChannel || contextChannel;
  const clientId = propClientId || contextClientId;
  const reset = propReset || contextReset;
  const setOverlay = propSetOverlay || contextSetOverlay;

  return (
    <MemoizedChannelInfoOverlay
      {...{
        channel,
        clientId,
        reset,
        setOverlay,
        visible,
      }}
    />
  );
};

ChannelInfoOverlay.displayName = 'ChannelInfoOverlay{channelInfoOverlay}';
