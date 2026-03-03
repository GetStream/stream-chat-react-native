import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
} from 'react-native-reanimated';
import {
  CircleClose,
  Delete,
  User,
  UserMinus,
  useTheme,
  useViewport,
  UserAvatar,
  BottomSheetModal,
  useStableCallback,
} from 'stream-chat-react-native';
import { ChannelMemberResponse } from 'stream-chat';

import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useChannelInfoOverlayContext } from '../context/ChannelInfoOverlayContext';
import { Archive } from '../icons/Archive';
import { useChannelInfoOverlayActions } from '../hooks/useChannelInfoOverlayActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pin } from '../icons/Pin.tsx';

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
  userItemContainer: { marginHorizontal: 8, alignItems: 'center' },
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
  const { visible } = props;

  const { setOverlay } = useAppOverlayContext();
  const { data } = useChannelInfoOverlayContext();
  const { vw } = useViewport();

  const width = vw(100) - 60;

  const { channel, clientId, membership, navigation } = data || {};

  const {
    theme: {
      colors: { accent_red, black, grey },
      semantics,
    },
  } = useTheme();

  // magic number 8 used as fontSize is 16 so assuming average character width of half
  const maxWidth = channel
    ? Math.floor(width / 8 - Object.keys(channel.state.members || {}).length.toString().length)
    : 0;
  const channelName = channel
    ? channel.data?.name ||
      Object.values<ChannelMemberResponse>(channel.state.members)
        .slice(0)
        .reduce<string>((returnString, currentMember, index, originalArray) => {
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
    ? Object.values<ChannelMemberResponse>(channel.state.members).filter(
        (member) => member.user?.id !== clientId,
      )
    : [];

  const { viewInfo, pinUnpin, archiveUnarchive, leaveGroup, deleteConversation, cancel } =
    useChannelInfoOverlayActions({ channel, navigation, otherMembers });

  const onClose = useStableCallback(() => {
    setOverlay('none');
  });

  return (
    <BottomSheetModal visible={!!visible} onClose={onClose}>
      <SafeAreaView edges={['bottom']}>
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
                      Object.values<ChannelMemberResponse>(channel.state.members).filter(
                        (member) => !!member.user?.online,
                      ).length
                    } Online`}
              </Text>
              <FlatList
                contentContainerStyle={styles.flatListContent}
                data={Object.values<ChannelMemberResponse>(channel.state.members)
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
                      <UserAvatar user={item} size='lg' showOnlineIndicator={item.online} />

                      <Text style={[styles.userName, { color: black }]}>
                        {item.name || item.id || ''}
                      </Text>
                    </View>
                  ) : null
                }
                style={styles.flatList}
              />
            </View>
            <Pressable onPress={viewInfo}>
              <View
                style={[
                  styles.row,
                  {
                    borderTopColor: semantics.borderCoreDefault,
                  },
                ]}
              >
                <View style={styles.rowInner}>
                  <User pathFill={grey} />
                </View>
                <Text style={[styles.rowText, { color: black }]}>View info</Text>
              </View>
            </Pressable>
            <Pressable onPress={pinUnpin}>
              <View
                style={[
                  styles.row,
                  {
                    borderTopColor: semantics.borderCoreDefault,
                  },
                ]}
              >
                <View style={styles.rowInner}>
                  <Pin height={24} width={24} />
                </View>
                <Text style={[styles.rowText, { color: black }]}>
                  {membership?.pinned_at ? 'Unpin' : 'Pin'}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={archiveUnarchive}>
              <View
                style={[
                  styles.row,
                  {
                    borderTopColor: semantics.borderCoreDefault,
                  },
                ]}
              >
                <View style={styles.rowInner}>
                  <Archive height={24} width={24} />
                </View>
                <Text style={[styles.rowText, { color: black }]}>
                  {membership?.archived_at ? 'Unarchive' : 'Archive'}
                </Text>
              </View>
            </Pressable>

            {otherMembers.length > 1 && (
              <Pressable onPress={leaveGroup}>
                <View style={[styles.row, { borderTopColor: semantics.borderCoreDefault }]}>
                  <View style={styles.rowInner}>
                    <UserMinus pathFill={grey} />
                  </View>
                  <Text style={[styles.rowText, { color: black }]}>Leave Group</Text>
                </View>
              </Pressable>
            )}
            <Pressable onPress={deleteConversation}>
              <View
                style={[
                  styles.row,
                  {
                    borderTopColor: semantics.borderCoreDefault,
                  },
                ]}
              >
                <View style={styles.rowInner}>
                  <Delete height={24} width={24} stroke={accent_red} />
                </View>
                <Text style={[styles.rowText, { color: accent_red }]}>Delete conversation</Text>
              </View>
            </Pressable>
            <Pressable onPress={cancel}>
              <View
                style={[
                  styles.lastRow,
                  {
                    borderBottomColor: semantics.borderCoreDefault,
                    borderTopColor: semantics.borderCoreDefault,
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
    </BottomSheetModal>
  );
};
