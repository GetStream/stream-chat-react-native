import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BottomSheetModal,
  CircleBan,
  useChatContext,
  useStableCallback,
  useTheme,
  UserAvatar,
} from 'stream-chat-react-native';

import { ListItem } from './ListItem';

import { Message } from '../icons/Message';
import { Mute } from '../icons/Mute';
import { getUserActivityStatus } from '../utils/getUserActivityStatus';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Channel, ChannelMemberResponse } from 'stream-chat';
import type { StackNavigatorParamList } from '../types';

const SHEET_HEIGHT = 260;

type ContactDetailBottomSheetProps = {
  channel: Channel;
  member: ChannelMemberResponse | null;
  navigation: NativeStackNavigationProp<StackNavigatorParamList, 'GroupChannelDetailsScreen'>;
  onClose: () => void;
  visible: boolean;
};

export const ContactDetailBottomSheet = React.memo(
  ({ member, navigation, onClose, visible }: ContactDetailBottomSheetProps) => {
    const {
      theme: { semantics },
    } = useTheme();
    const { client } = useChatContext();
    const styles = useStyles();

    const stableOnClose = useStableCallback(onClose);

    const user = member?.user;
    const activityStatus = user ? getUserActivityStatus(user) : '';
    const isMuted = client.mutedUsers?.some((m) => m.target.id === user?.id) ?? false;

    const sendDirectMessage = useCallback(async () => {
      if (!client.user?.id || !user?.id) return;

      const members = [client.user.id, user.id];

      try {
        const channels = await client.queryChannels({ members });

        const dmChannel =
          channels.length === 1 ? channels[0] : client.channel('messaging', { members });

        await dmChannel.watch();

        stableOnClose();
        navigation.navigate('ChannelScreen', {
          channel: dmChannel,
          channelId: dmChannel.id,
        });
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
    }, [client, navigation, stableOnClose, user?.id]);

    const muteUser = useCallback(async () => {
      if (!user?.id) return;

      try {
        const _isMuted = client.mutedUsers?.some((m) => m.target.id === user.id);
        if (_isMuted) {
          await client.unmuteUser(user.id);
        } else {
          await client.muteUser(user.id);
        }
        stableOnClose();
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
    }, [client, stableOnClose, user?.id]);

    const blockUser = useCallback(async () => {
      if (!user?.id) return;

      try {
        await client.blockUser(user.id);
        stableOnClose();
      } catch (error) {
        if (error instanceof Error) {
          Alert.alert('Error', error.message);
        }
      }
    }, [client, stableOnClose, user?.id]);

    if (!user) return null;

    return (
      <BottomSheetModal visible={visible} onClose={stableOnClose} height={SHEET_HEIGHT}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.header}>
            <UserAvatar user={user} size='lg' showOnlineIndicator={user.online} showBorder />
            <View style={styles.headerText}>
              <Text style={[styles.name, { color: semantics.textPrimary }]} numberOfLines={1}>
                {user.name || user.id}
              </Text>
              {activityStatus ? (
                <Text style={[styles.status, { color: semantics.textTertiary }]} numberOfLines={1}>
                  {activityStatus}
                </Text>
              ) : null}
            </View>
          </View>

          <ListItem
            icon={<Message height={20} width={20} fill={semantics.textPrimary} />}
            label='Send Direct Message'
            onPress={sendDirectMessage}
          />
          <ListItem
            icon={<Mute height={20} width={20} fill={semantics.textPrimary} />}
            label={isMuted ? 'Unmute User' : 'Mute User'}
            onPress={muteUser}
          />
          <ListItem
            icon={<CircleBan height={20} width={20} stroke={semantics.textPrimary} />}
            label='Block User'
            onPress={blockUser}
          />
        </SafeAreaView>
      </BottomSheetModal>
    );
  },
);

ContactDetailBottomSheet.displayName = 'ContactDetailBottomSheet';

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
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        headerText: {
          flex: 1,
          gap: 4,
        },
        name: {
          fontSize: 17,
          fontWeight: '600',
          lineHeight: 20,
        },
        status: {
          fontSize: 15,
          fontWeight: '400',
          lineHeight: 20,
        },
      }),
    [],
  );
};
