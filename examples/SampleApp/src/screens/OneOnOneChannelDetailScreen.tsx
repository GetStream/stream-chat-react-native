import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  ChannelAvatar,
  CircleBan,
  Delete,
  useChannelMuteActive,
  Pin,
  useTheme,
} from 'stream-chat-react-native';

import { ChannelDetailProfileSection } from '../components/ChannelDetailProfileSection';
import { ConfirmationBottomSheet } from '../components/ConfirmationBottomSheet';
import { ListItem } from '../components/ListItem';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { useAppContext } from '../context/AppContext';
import { File } from '../icons/File';
import { GoForward } from '../icons/GoForward';
import { Mute } from '../icons/Mute';
import { Picture } from '../icons/Picture';
import type { StackNavigatorParamList } from '../types';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';
import { getRtlMirrorSwitchStyle } from '../utils/rtlMirrorSwitchStyle';

type OneOnOneChannelDetailScreenRouteProp = RouteProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type OneOnOneChannelDetailScreenNavigationProp = NativeStackNavigationProp<
  StackNavigatorParamList,
  'OneOnOneChannelDetailScreen'
>;

type Props = {
  navigation: OneOnOneChannelDetailScreenNavigationProp;
  route: OneOnOneChannelDetailScreenRouteProp;
};

export const OneOnOneChannelDetailScreen: React.FC<Props> = ({
  navigation,
  route: {
    params: { channel },
  },
}) => {
  const {
    theme: { semantics },
  } = useTheme();
  const { chatClient } = useAppContext();
  const userMuted = useChannelMuteActive(channel);

  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [blockUserConfirmationVisible, setBlockUserConfirmationVisible] = useState(false);

  const member = Object.values(channel.state.members).find(
    (channelMember) => channelMember.user?.id !== chatClient?.user?.id,
  );

  const user = member?.user;
  const [muted, setMuted] = useState(
    chatClient?.mutedUsers &&
      chatClient.mutedUsers.findIndex((mutedUser) => mutedUser.target.id === user?.id) > -1,
  );

  const deleteConversation = useCallback(async () => {
    try {
      await channel.delete();
      navigation.reset({
        index: 0,
        routes: [{ name: 'MessagingScreen' }],
      });
    } catch (error) {
      console.error('Error deleting conversation', error);
    }
  }, [channel, navigation]);

  const handleBlockUser = useCallback(async () => {
    try {
      if (!user?.id) {
        return;
      }
      await chatClient?.blockUser(user.id);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MessagingScreen' }],
      });
    } catch (error) {
      console.error('Error blocking user', error);
    }
  }, [chatClient, navigation, user?.id]);

  const openDeleteConversationConfirmationSheet = useCallback(() => {
    if (!chatClient?.user?.id) {
      return;
    }
    setConfirmationVisible(true);
  }, [chatClient?.user?.id]);

  const openBlockUserConfirmationSheet = useCallback(() => {
    if (!user?.id) {
      return;
    }
    setBlockUserConfirmationVisible(true);
  }, [user?.id]);

  const closeConfirmation = useCallback(() => {
    setConfirmationVisible(false);
  }, []);

  const closeBlockUserConfirmation = useCallback(() => {
    setBlockUserConfirmationVisible(false);
  }, []);

  const handleMuteToggle = useCallback(async () => {
    if (muted) {
      await chatClient?.unmuteUser(user!.id);
    } else {
      await chatClient?.muteUser(user!.id);
    }
    setMuted((prev) => !prev);
  }, [chatClient, muted, user]);

  const navigateToPinnedMessages = useCallback(() => {
    navigation.navigate('ChannelPinnedMessagesScreen', { channel });
  }, [channel, navigation]);

  const navigateToImages = useCallback(() => {
    navigation.navigate('ChannelImagesScreen', { channel });
  }, [channel, navigation]);

  const navigateToFiles = useCallback(() => {
    navigation.navigate('ChannelFilesScreen', { channel });
  }, [channel, navigation]);

  if (!user) {
    return null;
  }

  const activityStatus = getUserActivityStatus(user);
  const chevronRight = <GoForward height={20} width={20} stroke={semantics.textSecondary} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: semantics.backgroundCoreApp }]}>
      <ScreenHeader inSafeArea titleText='Contact Info' />
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <ChannelDetailProfileSection
          avatar={<ChannelAvatar channel={channel} size='2xl' />}
          muted={userMuted}
          title={user.name || user.id}
          subtitle={activityStatus}
        />

        <SectionCard>
          <ListItem
            icon={<Pin height={20} width={20} stroke={semantics.textSecondary} />}
            label='Pinned Messages'
            trailing={chevronRight}
            onPress={navigateToPinnedMessages}
          />
          <ListItem
            icon={<Picture height={20} width={20} fill={semantics.textSecondary} />}
            label='Photos & Videos'
            trailing={chevronRight}
            onPress={navigateToImages}
          />
          <ListItem
            icon={<File height={20} width={20} stroke={semantics.textSecondary} />}
            label='Files'
            trailing={chevronRight}
            onPress={navigateToFiles}
          />
        </SectionCard>

        <SectionCard>
          <ListItem
            icon={<Mute height={20} width={20} fill={semantics.textSecondary} />}
            label='Mute User'
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
            icon={<CircleBan height={20} width={20} stroke={semantics.textSecondary} />}
            label='Block User'
            onPress={openBlockUserConfirmationSheet}
          />
          <ListItem
            icon={
              <Delete
                height={20}
                width={20}
                fill={semantics.accentError}
                stroke={semantics.accentError}
              />
            }
            label='Delete Conversation'
            destructive
            onPress={openDeleteConversationConfirmationSheet}
          />
        </SectionCard>
      </ScrollView>
      <ConfirmationBottomSheet
        confirmText='DELETE'
        onClose={closeConfirmation}
        onConfirm={deleteConversation}
        subtext='Are you sure you want to delete this conversation?'
        title='Delete Conversation'
        visible={confirmationVisible}
      />
      <ConfirmationBottomSheet
        confirmText='BLOCK'
        onClose={closeBlockUserConfirmation}
        onConfirm={handleBlockUser}
        subtext='Are you sure you want to block this user?'
        title='Block User'
        visible={blockUserConfirmationVisible}
      />
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
});
