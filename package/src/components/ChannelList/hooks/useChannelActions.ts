import { useMemo } from 'react';
import { Alert } from 'react-native';

import { Channel, ChannelMemberResponse } from 'stream-chat';

import { useChannelMembershipState } from './useChannelMembershipState';

import { useChannelMembersState } from './useChannelMembersState';

import { useChatContext } from '../../../contexts';
import { useStableCallback } from '../../../hooks';

export const useChannelActions = (channel: Channel) => {
  const { client } = useChatContext();
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

  const leaveGroup = useStableCallback(async () => {
    if (!channel) {
      return;
    }
    if (ownUserId) {
      await channel.removeMembers([ownUserId]);
    }
  });

  const deleteConversation = useStableCallback(() => {
    if (!channel) {
      return;
    }

    const isDirectChat = otherMembers?.length === 1;
    const title = `Delete ${isDirectChat ? 'chat' : 'group'}`;
    const message = `Are you sure you want to delete this ${isDirectChat ? 'chat' : 'group'}? This can't be undone.`;

    Alert.alert(title, message, [
      {
        style: 'cancel',
        text: 'Cancel',
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
        text: 'Delete',
      },
    ]);
  });

  return { pinUnpin, archiveUnarchive, leaveGroup, deleteConversation };
};
