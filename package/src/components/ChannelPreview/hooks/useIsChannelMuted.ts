import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

const defaultMuteStatus = {
  createdAt: null,
  expiresAt: null,
  muted: false,
};

export const useIsChannelMuted = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const [muted, setMuted] = useState(() => channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => {
      setMuted(channel.muteStatus());
    };

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
  }, [channel, client, muted]);

  return muted ?? defaultMuteStatus;
};
