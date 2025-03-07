import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
  ) => void;
};

export const useChannelDeleted = ({ onChannelDeleted, setChannels }: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (typeof onChannelDeleted === 'function') {
        onChannelDeleted(setChannels, event);
      } else {
        setChannels((channels) => {
          if (!channels) {
            return channels;
          }
          const index = channels.findIndex(
            (channel) => channel.cid === (event.cid || event.channel?.cid),
          );
          if (index >= 0) {
            channels.splice(index, 1);
          }
          return [...channels];
        });
      }
    };

    const listener = client?.on('channel.deleted', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
