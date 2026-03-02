import { useMemo } from 'react';
import { Alert } from 'react-native';

import { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMembershipState } from './useChannelMembershipState';

import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext, useTranslationContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';

export type ChannelActions = {
  archiveUnarchive: () => Promise<void>;
  deleteChannel: () => void;
  leave: () => Promise<void>;
  pinUnpin: () => Promise<void>;
};

export const useChannelActions = (channel: Channel) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const ownUserId = client.userID;
  const membership = useChannelMembershipState(channel);
  const members = useChannelMembersState(channel);

  const otherMembers = useMemo(
    () =>
      Object.values<ChannelMemberResponse>(members).filter(
        (member) => member.user?.id !== ownUserId,
      ),
    [members, ownUserId],
  );

  const pinUnpin = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      if (membership?.pinned_at) {
        await channel.unpin();
      } else {
        await channel.pin();
      }
    } catch (error) {
      console.log('Error pinning/unpinning channel', error);
    }
  });

  const archiveUnarchive = useStableCallback(async () => {
    try {
      if (!channel) {
        return;
      }
      if (membership?.archived_at) {
        await channel.unarchive();
      } else {
        await channel.archive();
      }
    } catch (error) {
      console.log('Error archiving/unarchiving channel', error);
    }
  });

  const leave = useStableCallback(async () => {
    if (!channel) {
      return;
    }
    if (ownUserId) {
      await channel.removeMembers([ownUserId]);
    }
  });

  const deleteChannel = useStableCallback(() => {
    if (!channel) {
      return;
    }

    const isDirectChat = otherMembers?.length === 1;
    const title = isDirectChat ? t('Delete chat') : t('Delete group');
    const message = isDirectChat
      ? t("Are you sure you want to delete this chat? This can't be undone.")
      : t("Are you sure you want to delete this group? This can't be undone.");

    Alert.alert(title, message, [
      {
        style: 'cancel',
        text: t('Cancel'),
      },
      {
        onPress: async () => {
          try {
            await channel.delete();
          } catch (error) {
            console.log('Error deleting channel', error);
          }
        },
        style: 'destructive',
        text: t('Delete'),
      },
    ]);
  });

  return useMemo<ChannelActions>(
    () => ({ pinUnpin, archiveUnarchive, leave, deleteChannel }),
    [archiveUnarchive, deleteChannel, leave, pinUnpin],
  );
};
