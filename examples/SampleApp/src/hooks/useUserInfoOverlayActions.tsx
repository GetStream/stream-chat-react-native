import { useChatContext } from 'stream-chat-react-native';
import { useAppOverlayContext } from '../context/AppOverlayContext';
import { useBottomSheetOverlayContext } from '../context/BottomSheetOverlayContext';
import { useUserInfoOverlayContext } from '../context/UserInfoOverlayContext';
import { Alert } from 'react-native';

export const useUserInfoOverlayActions = () => {
  const { client } = useChatContext();
  const { setOverlay } = useAppOverlayContext();
  const { setData } = useBottomSheetOverlayContext();
  const { data } = useUserInfoOverlayContext();
  const { channel, member, navigation } = data ?? {};

  const viewInfo = async () => {
    if (!client.user?.id || !member) {
      return;
    }

    const members = [client.user.id, member.user?.id || ''];

    // Check if the channel already exists.
    const channels = await client.queryChannels({
      members,
    });

    let newChannel;
    if (channels.length === 1) {
      newChannel = channels[0];
    } else {
      try {
        newChannel = client.channel('messaging', { members });
        await newChannel.watch();
      } catch (error) {
        newChannel = undefined;
        if (error instanceof Error) {
          Alert.alert('Error creating channel', error.message);
        }
      }
    }

    setOverlay('none');
    if (navigation && newChannel) {
      navigation.navigate('OneOnOneChannelDetailScreen', {
        channel: newChannel,
      });
    }
  };

  const messageUser = async () => {
    if (!client.user?.id || !member) {
      return;
    }

    const members = [client.user.id, member.user?.id || ''];

    // Check if the channel already exists.
    const channels = await client.queryChannels({
      members,
    });

    const newChannel =
      channels.length === 1
        ? channels[0]
        : client.channel('messaging', {
            members,
          });

    setOverlay('none');
    if (navigation) {
      navigation.navigate('ChannelScreen', {
        channel: newChannel,
        channelId: newChannel.id,
      });
    }
  };

  const removeFromGroup = () => {
    if (!channel || !member) {
      return;
    }
    setData({
      confirmText: 'REMOVE',
      onConfirm: () => {
        if (member.user?.id) {
          channel.removeMembers([member.user.id]);
        }
        setOverlay('none');
      },
      subtext: `Are you sure you want to remove User from ${channel?.data?.name || 'group'}?`,
      title: 'Remove User',
    });
    setOverlay('confirmation');
  };

  const cancel = () => {
    setOverlay('none');
  };

  return { viewInfo, messageUser, removeFromGroup, cancel };
};
