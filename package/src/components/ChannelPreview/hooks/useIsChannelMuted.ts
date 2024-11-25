import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useIsChannelMuted = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const initialized = channel?.initialized;

  const [muted, setMuted] = useState(() => initialized && channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => {
      setMuted(initialized && channel.muteStatus());
    };

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
  }, [channel, client, initialized, muted]);

  return muted || { createdAt: null, expiresAt: null, muted: false };
};
