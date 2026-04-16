import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  StreamBottomSheetModalFlatList,
  UserAdd,
  useStableCallback,
  useTheme,
} from 'stream-chat-react-native';

import { ContactDetailBottomSheet } from './ContactDetailBottomSheet';
import { MemberListItem } from './MemberListItem';
import { Close } from '../icons/Close';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Channel, ChannelMemberResponse } from 'stream-chat';
import type { StackNavigatorParamList } from '../types';

type AllMembersBottomSheetProps = {
  channel: Channel;
  channelCreatorId: string | undefined;
  currentUserId: string | undefined;
  navigation: NativeStackNavigationProp<StackNavigatorParamList, 'GroupChannelDetailsScreen'>;
  onClose: () => void;
  visible: boolean;
  onAddMember?: () => void;
};

const keyExtractor = (item: ChannelMemberResponse) => item.user_id ?? item.user?.id ?? '';

export const AllMembersBottomSheet = React.memo(
  ({
    channel,
    channelCreatorId,
    currentUserId,
    navigation,
    onAddMember,
    onClose,
    visible,
  }: AllMembersBottomSheetProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const styles = useStyles();

    const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

    const members = useMemo(() => Object.values(channel.state.members), [channel.state.members]);

    const memberCount = channel?.data?.member_count ?? members.length;

    const stableOnClose = useStableCallback(onClose);

    const handleMemberPress = useCallback(
      (member: ChannelMemberResponse) => {
        if (member.user?.id !== currentUserId) {
          setSelectedMember(member);
        }
      },
      [currentUserId],
    );

    const closeContactDetail = useCallback(() => {
      setSelectedMember(null);
      stableOnClose();
    }, [stableOnClose]);

    const renderItem = useCallback(
      ({ item }: { item: ChannelMemberResponse }) => (
        <MemberListItem
          member={item}
          isCurrentUser={item.user?.id === currentUserId}
          isOwner={channelCreatorId === item.user?.id}
          onPress={() => handleMemberPress(item)}
        />
      ),
      [channelCreatorId, currentUserId, handleMemberPress],
    );

    return (
      <BottomSheetModal visible={visible} onClose={stableOnClose}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable
              onPress={stableOnClose}
              style={[styles.iconButton, { borderColor: semantics.borderCoreDefault }]}
            >
              <Close height={20} width={20} pathFill={semantics.textPrimary} />
            </Pressable>

            <Text style={[styles.title, { color: semantics.textPrimary }]}>
              {`${memberCount} Members`}
            </Text>

            {onAddMember ? (
              <Pressable
                onPress={onAddMember}
                style={[styles.iconButton, { borderColor: semantics.borderCoreDefault }]}
              >
                <UserAdd height={20} width={20} stroke={semantics.textPrimary} />
              </Pressable>
            ) : (
              <View style={styles.iconButtonPlaceholder} />
            )}
          </View>

          <StreamBottomSheetModalFlatList
            data={members}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
        <ContactDetailBottomSheet
          channel={channel}
          member={selectedMember}
          navigation={navigation}
          onClose={closeContactDetail}
          visible={!!selectedMember}
        />
      </BottomSheetModal>
    );
  },
);

AllMembersBottomSheet.displayName = 'AllMembersBottomSheet';

const useStyles = () => {
  return useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        iconButton: {
          alignItems: 'center',
          borderRadius: 9999,
          borderWidth: 1,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        iconButtonPlaceholder: {
          height: 40,
          width: 40,
        },
        title: {
          flex: 1,
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 20,
          textAlign: 'center',
        },
        listContent: {
          paddingBottom: 40,
        },
      }),
    [],
  );
};
