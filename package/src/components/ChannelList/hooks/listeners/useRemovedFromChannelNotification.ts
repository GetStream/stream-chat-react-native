import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
  ) => void;
};

export const useRemovedFromChannelNotification = ({
  onRemovedFromChannel,
  setChannels,
}: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, event);
      } else {
        setChannels((channels) => {
          if (!channels) {
            return channels;
          }

          const newChannels = channels.filter((channel) => channel.cid !== event.channel?.cid);
          return [...newChannels];
        });
      }
    };

    const listener = client?.on('notification.removed_from_channel', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
