import { useEffect, useState } from 'react';

import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';

const defaultMuteStatus = {
  createdAt: null,
  expiresAt: null,
  muted: false,
};

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext();

  const [muted, setMuted] = useState(() => channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => {
      const newMuteStatus = channel.muteStatus();
      if (
        newMuteStatus.muted === muted.muted &&
        newMuteStatus.createdAt?.getTime?.() === muted.createdAt?.getTime?.() &&
        newMuteStatus.expiresAt?.getTime?.() === muted.expiresAt?.getTime?.()
      ) {
        return;
      }

      setMuted(channel.muteStatus());
    };

    const listeners = [
      client.on('notification.channel_mutes_updated', handleEvent),
      client.on('health.check', (event) => {
        if (event.me) {
          handleEvent();
        }
      }),
    ];
    return () => {
      listeners.forEach((listener) => listener.unsubscribe());
    };
  }, [channel, client, muted]);

  return muted ?? defaultMuteStatus;
};
