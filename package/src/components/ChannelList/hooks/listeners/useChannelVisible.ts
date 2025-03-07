import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { ChannelListEventListenerOptions } from '../../../../types/types';
import { getChannel, moveChannelUp } from '../../utils';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  options?: ChannelListEventListenerOptions;
};

export const useChannelVisible = ({ onChannelVisible, options, setChannels }: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = async (event: Event) => {
      if (typeof onChannelVisible === 'function') {
        onChannelVisible(setChannels, event);
      } else {
        if (!options) {
          return;
        }
        const { sort } = options;
        if (event.channel_id && event.channel_type) {
          const channel = await getChannel({
            client,
            id: event.channel_id,
            type: event.channel_type,
          });
          setChannels((channels) =>
            channels
              ? moveChannelUp({
                  channels,
                  channelToMove: channel,
                  sort,
                })
              : channels,
          );
        }
      }
    };

    const listener = client?.on('channel.visible', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
