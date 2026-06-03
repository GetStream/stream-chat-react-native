import { Channel } from 'stream-chat';

import { getOtherUserInDirectChannel } from './actions/useChannelActions';

import { useIsDirectChat } from './useIsDirectChat';

import { useMutedChannels } from '../components/ChannelList/hooks/useMutedChannels';
import { useUserMuteActive } from '../components/Message/hooks/useUserMuteActive';

export const useChannelMuteActive = (channel: Channel) => {
  const isDirectChat = useIsDirectChat(channel);
  const mutedChannels = useMutedChannels(channel);
  const otherUser = getOtherUserInDirectChannel(channel)?.user;
  const otherUserMuted = useUserMuteActive(otherUser);

  const channelMuted = !!mutedChannels.find(
    (mutedChannel) => channel.cid === mutedChannel.channel?.cid,
  );

  if (!isDirectChat) {
    return channelMuted;
  }

  return channelMuted || otherUserMuted;
};
