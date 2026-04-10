import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { RouteProp, useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ChannelMemberResponse, UserResponse } from 'stream-chat';

import {
  ChannelAvatar,
  useChannelPreviewDisplayName,
  useIsChannelMuted,
  useOverlayContext,
  useTheme,
  Pin,
} from 'stream-chat-react-native';

import { AddMembersBottomSheet } from '../components/AddMembersBottomSheet';
import { AllMembersBottomSheet } from '../components/AllMembersBottomSheet';
import { ChannelDetailProfileSection } from '../components/ChannelDetailProfileSection';
import { ConfirmationBottomSheet } from '../components/ConfirmationBottomSheet';
import { ContactDetailBottomSheet } from '../components/ContactDetailBottomSheet';
import { EditGroupBottomSheet } from '../components/EditGroupBottomSheet';
import { ListItem } from '../components/ListItem';
import { MemberListItem } from '../components/MemberListItem';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { useAppContext } from '../context/AppContext';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { LeaveGroup } from '../icons/LeaveGroup';
import { Mute } from '../icons/Mute';
import { Picture } from '../icons/Picture';
import type { StackNavigatorParamList } from '../types';
import { getRtlMirrorSwitchStyle } from '../utils/rtlMirrorSwitchStyle';

const MAX_VISIBLE_MEMBERS = 5;

type GroupChannelDetailsRouteProp = RouteProp<StackNavigatorParamList, 'GroupChannelDetailsScreen'>;

type GroupChannelDetailsProps = {
  route: GroupChannelDetailsRouteProp;
};

type GroupChannelDetailsScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'GroupChannelDetailsScreen'
>;

export const GroupChannelDetailsScreen: React.FC<GroupChannelDetailsProps> = ({
  route: {
    params: { channel },
  },
}) => {
  const { chatClient } = useAppContext();
  const navigation = useNavigation<GroupChannelDetailsScreenNavigationProp>();
  const { setOverlay } = useOverlayContext();
  const {
    theme: { semantics },
  } = useTheme();
  const { muted: channelMuted } = useIsChannelMuted(channel);

  const [muted, setMuted] = useState(
    chatClient?.mutedChannels.some((mute) => mute.channel?.id === channel?.id),
  );
  const [allMembersVisible, setAllMembersVisible] = useState(false);
  const [addMembersVisible, setAddMembersVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ChannelMemberResponse | null>(null);

  const displayName = useChannelPreviewDisplayName(channel, 30);
  const allMembers = useMemo(() => Object.values(channel.state.members), [channel.state.members]);
  const memberCount = channel?.data?.member_count ?? allMembers.length;
  const onlineCount = channel.state.watcher_count ?? 0;

  const memberStatusText = useMemo(() => {
    const parts = [`${memberCount} members`];
    if (onlineCount > 0) {
      parts.push(`${onlineCount} online`);
    }
    return parts.join(' · ');
  }, [memberCount, onlineCount]);

  const visibleMembers = useMemo(() => allMembers.slice(0, MAX_VISIBLE_MEMBERS), [allMembers]);
  const hasMoreMembers = allMembers.length > MAX_VISIBLE_MEMBERS;

  const channelCreatorId =
    channel.data && (channel.data.created_by_id || (channel.data.created_by as UserResponse)?.id);

  const leaveGroup = useCallback(async () => {
    if (chatClient?.user?.id) {
      await channel.removeMembers([chatClient.user.id]);
    }
    setOverlay('none');
    navigation.reset({
      index: 0,
      routes: [{ name: 'MessagingScreen' }],
    });
  }, [channel, chatClient?.user?.id, navigation, setOverlay]);

  const openLeaveGroupConfirmationSheet = useCallback(() => {
    if (!chatClient?.user?.id) {
      return;
    }
    setConfirmationVisible(true);
  }, [chatClient?.user?.id]);

  const closeConfirmation = useCallback(() => {
    setConfirmationVisible(false);
  }, []);

  const openAddMembersSheet = useCallback(() => {
    if (!chatClient?.user?.id) return;
    setAddMembersVisible(true);
  }, [chatClient?.user?.id]);

  const openAddMembersFromAllMembers = useCallback(() => {
    if (!chatClient?.user?.id) return;
    setAllMembersVisible(false);
    setAddMembersVisible(true);
  }, [chatClient?.user?.id]);

  const closeAddMembers = useCallback(() => {
    setAddMembersVisible(false);
  }, []);

  const handleMuteToggle = useCallback(async () => {
    if (muted) {
      await channel.unmute();
    } else {
      await channel.mute();
    }
    setMuted((prev) => !prev);
  }, [channel, muted]);

  const navigateToPinnedMessages = useCallback(() => {
    navigation.navigate('ChannelPinnedMessagesScreen', { channel });
  }, [channel, navigation]);

  const navigateToImages = useCallback(() => {
    navigation.navigate('ChannelImagesScreen', { channel });
  }, [channel, navigation]);

  const navigateToFiles = useCallback(() => {
    navigation.navigate('ChannelFilesScreen', { channel });
  }, [channel, navigation]);

  const handleMemberPress = useCallback(
    (member: ChannelMemberResponse) => {
      if (member.user?.id !== chatClient?.user?.id) {
        setSelectedMember(member);
      }
    },
    [chatClient?.user?.id],
  );

  const closeContactDetail = useCallback(() => {
    setSelectedMember(null);
  }, []);

  const isCreator = channelCreatorId === chatClient?.user?.id;

  const openAllMembers = useCallback(() => {
    setAllMembersVisible(true);
  }, []);

  const closeAllMembers = useCallback(() => {
    setAllMembersVisible(false);
  }, []);

  const openEditSheet = useCallback(() => {
    setEditVisible(true);
  }, []);

  const closeEditSheet = useCallback(() => {
    setEditVisible(false);
  }, []);

  const rightContent = useMemo(
    () => (
      <Pressable
        onPress={openEditSheet}
        style={[styles.outlineButton, { borderColor: semantics.borderCoreDefault }]}
      >
        <Text style={[styles.outlineButtonLabel, { color: semantics.textPrimary }]}>Edit</Text>
      </Pressable>
    ),
    [openEditSheet, semantics.borderCoreDefault, semantics.textPrimary],
  );

  if (!channel) {
    return null;
  }

  const chevronRight = <GoForward height={20} width={20} stroke={semantics.textSecondary} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: semantics.backgroundCoreApp }]}>
      <ScreenHeader inSafeArea titleText='Group Info' RightContent={() => rightContent} />
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <ChannelDetailProfileSection
          avatar={<ChannelAvatar channel={channel} size='2xl' />}
          muted={channelMuted}
          title={displayName}
          subtitle={memberStatusText}
        />

        <SectionCard>
          <ListItem
            icon={<Pin height={20} width={20} stroke={semantics.textPrimary} />}
            label='Pinned Messages'
            trailing={chevronRight}
            onPress={navigateToPinnedMessages}
          />
          <ListItem
            icon={<Picture height={20} width={20} fill={semantics.textPrimary} />}
            label='Photos & Videos'
            trailing={chevronRight}
            onPress={navigateToImages}
          />
          <ListItem
            icon={<File height={20} width={20} stroke={semantics.textPrimary} />}
            label='Files'
            trailing={chevronRight}
            onPress={navigateToFiles}
          />
        </SectionCard>

        <SectionCard style={styles.membersCard}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderTitle, { color: semantics.textPrimary }]}>
              {`${memberCount} members`}
            </Text>
            {isCreator ? (
              <Pressable
                onPress={openAddMembersSheet}
                style={[styles.outlineButtonSm, { borderColor: semantics.borderCoreDefault }]}
              >
                <Text style={[styles.outlineButtonLabel, { color: semantics.textPrimary }]}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.memberList}>
            {visibleMembers.map((member) => {
              if (!member.user?.id) {
                return null;
              }
              return (
                <MemberListItem
                  key={member.user.id}
                  member={member}
                  isCurrentUser={member.user.id === chatClient?.user?.id}
                  isOwner={channelCreatorId === member.user.id}
                  onPress={() => handleMemberPress(member)}
                />
              );
            })}
          </View>
          {hasMoreMembers ? (
            <View style={[styles.sectionFooter, { borderTopColor: semantics.borderCoreDefault }]}>
              <Pressable onPress={openAllMembers} style={styles.viewAllButton}>
                <Text style={[styles.viewAllLabel, { color: semantics.textPrimary }]}>
                  View all
                </Text>
              </Pressable>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard>
          <ListItem
            icon={<Mute height={20} width={20} fill={semantics.textSecondary} />}
            label='Mute Group'
            trailing={
              <Switch
                onValueChange={handleMuteToggle}
                style={getRtlMirrorSwitchStyle()}
                trackColor={{
                  false: semantics.controlToggleSwitchBg,
                  true: semantics.accentPrimary,
                }}
                value={muted ?? false}
              />
            }
          />
          <ListItem
            icon={<LeaveGroup height={20} width={20} stroke={semantics.accentError} />}
            label='Leave Group'
            destructive
            onPress={openLeaveGroupConfirmationSheet}
          />
        </SectionCard>
      </ScrollView>
      <AllMembersBottomSheet
        channel={channel}
        channelCreatorId={channelCreatorId}
        currentUserId={chatClient?.user?.id}
        navigation={navigation}
        onAddMember={isCreator ? openAddMembersFromAllMembers : undefined}
        onClose={closeAllMembers}
        visible={allMembersVisible}
      />
      <AddMembersBottomSheet
        channel={channel}
        onClose={closeAddMembers}
        visible={addMembersVisible}
      />
      <ConfirmationBottomSheet
        confirmText='LEAVE'
        onClose={closeConfirmation}
        onConfirm={leaveGroup}
        subtext={`Are you sure you want to leave the group ${displayName || ''}?`}
        title='Leave group'
        visible={confirmationVisible}
      />
      <ContactDetailBottomSheet
        channel={channel}
        member={selectedMember}
        navigation={navigation}
        onClose={closeContactDetail}
        visible={selectedMember !== null}
      />
      <EditGroupBottomSheet channel={channel} onClose={closeEditSheet} visible={editVisible} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  membersCard: {
    paddingVertical: 0,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeaderTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 20,
  },
  memberList: {
    paddingBottom: 12,
  },
  sectionFooter: {
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  viewAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    width: '100%',
  },
  viewAllLabel: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 20,
  },
  outlineButton: {
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  outlineButtonSm: {
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  outlineButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 20,
  },
});
