import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[]>>;
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
};

export const useChannelUpdated = ({ onChannelUpdated, setChannels }: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (typeof onChannelUpdated === 'function') {
        onChannelUpdated(setChannels, event);
      } else {
        setChannels((channels) => {
          if (!channels) {
            return channels;
          }

          const index = channels.findIndex(
            (channel) => channel.cid === (event.cid || event.channel?.cid),
          );
          if (index >= 0 && event.channel) {
            channels[index].data = {
              ...event.channel,
              hidden: event.channel?.hidden ?? channels[index].data?.hidden,
              own_capabilities:
                event.channel?.own_capabilities ?? channels[index].data?.own_capabilities,
            };
          }

          return [...channels];
        });
      }
    };

    const listener = client?.on('channel.updated', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
