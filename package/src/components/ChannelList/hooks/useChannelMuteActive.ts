import { Channel } from 'stream-chat';

import { getOtherUserInDirectChannel } from './useChannelActions';
import { useIsDirectChat } from './useIsDirectChat';
import { useMutedChannels } from './useMutedChannels';
import { useMutedUsers } from './useMutedUsers';

export const useChannelMuteActive = (channel: Channel) => {
  const isDirectChat = useIsDirectChat(channel);
  const mutedChannels = useMutedChannels(channel);
  const mutedUsers = useMutedUsers(channel);

  return isDirectChat
    ? !!mutedUsers.find(
        (mutedUser) => getOtherUserInDirectChannel(channel)?.user?.id === mutedUser.target.id,
      )
    : !!mutedChannels.find((mutedChannel) => channel.cid === mutedChannel.channel?.cid);
};
