import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useUserPresence = ({ setChannels, setForceUpdate }: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setChannels((channels) => {
        if (!channels) {
          return channels;
        }

        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id]) {
            return channel;
          }
          channel.state.members[event.user.id].user = event.user;
          return channel;
        });

        return [...newChannels];
      });
      setForceUpdate((u) => u + 1);
    };

    const listeners = [
      client?.on('user.presence.changed', handleEvent),
      client?.on('user.updated', handleEvent),
    ];

    return () => {
      listeners?.forEach((l) => l?.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
