import { Channel } from 'stream-chat';

import { getOtherUserInDirectChannel } from './actions/useChannelActions';

import { useIsDirectChat } from './useIsDirectChat';

import { useIsChannelMuted } from '../components/ChannelPreview/hooks/useIsChannelMuted';
import { useUserMuteActive } from '../components/Message/hooks/useUserMuteActive';

export const useChannelMuteActive = (channel: Channel) => {
  const isDirectChat = useIsDirectChat(channel);
  const { muted: channelMuted } = useIsChannelMuted(channel);
  const otherUser = getOtherUserInDirectChannel(channel)?.user;
  const otherUserMuted = useUserMuteActive(otherUser);

  if (!isDirectChat) {
    return channelMuted;
  }

  return channelMuted || otherUserMuted;
};
