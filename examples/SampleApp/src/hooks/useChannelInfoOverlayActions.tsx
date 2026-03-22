import {
  ChannelListScreenNavigationProp,
  useChannelInfoOverlayContext,
} from '../context/ChannelInfoOverlayContext';
import { Channel, ChannelMemberResponse } from 'stream-chat';
import { useAppOverlayContext } from '../context/AppOverlayContext';

import type { ConfirmationData } from '../components/ConfirmationBottomSheet';

export type UseChannelInfoOverlayGesturesParams = {
  showConfirmation: (data: ConfirmationData) => void;
  channel?: Channel;
  navigation?: ChannelListScreenNavigationProp;
  otherMembers?: ChannelMemberResponse[];
};

export const useChannelInfoOverlayActions = (params: UseChannelInfoOverlayGesturesParams) => {
  const { navigation, channel, otherMembers, showConfirmation } = params;
  const { data } = useChannelInfoOverlayContext();
  const { setOverlay } = useAppOverlayContext();

  const { clientId, membership } = data || {};

  const viewInfo = () => {
    if (!channel) {
      return;
    }
    setOverlay('none');
    if (navigation) {
      if (otherMembers?.length === 1) {
        navigation.navigate('OneOnOneChannelDetailScreen', {
          channel,
        });
      } else {
        navigation.navigate('GroupChannelDetailsScreen', {
          channel,
        });
      }
    }
  };

  const pinUnpin = async () => {
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

    setOverlay('none');
  };

  const archiveUnarchive = async () => {
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

    setOverlay('none');
  };

  const leaveGroup = () => {
    if (!channel) {
      return;
    }
    if (clientId) {
      channel.removeMembers([clientId]);
    }
    setOverlay('none');
  };

  const deleteConversation = async () => {
    if (!channel) {
      return;
    }
    showConfirmation({
      confirmText: 'DELETE',
      onConfirm: () => {
        channel.delete();
        setOverlay('none');
      },
      subtext: `Are you sure you want to delete this ${
        otherMembers?.length === 1 ? 'conversation' : 'group'
      }?`,
      title: `Delete ${otherMembers?.length === 1 ? 'Conversation' : 'Group'}`,
    });
  };

  const cancel = () => {
    setOverlay('none');
  };

  return { viewInfo, pinUnpin, archiveUnarchive, leaveGroup, deleteConversation, cancel };
};
