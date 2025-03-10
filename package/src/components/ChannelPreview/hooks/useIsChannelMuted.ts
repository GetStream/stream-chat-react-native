import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext();

  const [muted, setMuted] = useState(() => channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => {
      setMuted(channel.muteStatus());
    };

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
  }, [channel, client, muted]);

  return muted || { createdAt: null, expiresAt: null, muted: false };
};
