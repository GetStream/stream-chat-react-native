import { Channel } from 'stream-chat';

import { getOtherUserInDirectChannel } from './useChannelActions';

import { useIsDirectChat } from './useIsDirectChat';

import { useMutedChannels } from '../components/ChannelList/hooks/useMutedChannels';
import { useMutedUsers } from '../components/ChannelList/hooks/useMutedUsers';

export const useChannelMuteActive = (channel: Channel) => {
  const isDirectChat = useIsDirectChat(channel);
  const mutedChannels = useMutedChannels(channel);
  const mutedUsers = useMutedUsers(channel);

  const channelMuted = !!mutedChannels.find(
    (mutedChannel) => channel.cid === mutedChannel.channel?.cid,
  );

  if (!isDirectChat) {
    return channelMuted;
  }

  const otherUserId = getOtherUserInDirectChannel(channel)?.user?.id;
  const otherUserMuted = !!mutedUsers.find((mutedUser) => otherUserId === mutedUser.target.id);

  return channelMuted || otherUserMuted;
};
