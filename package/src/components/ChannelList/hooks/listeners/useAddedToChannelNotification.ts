import React, { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { ChannelListEventListenerOptions } from '../../../../types/types';
import { getChannel } from '../../utils';
import { findLastPinnedChannelIndex, findPinnedAtSortOrder } from '../utils';

type Parameters = {
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  options?: ChannelListEventListenerOptions;
};

export const useAddedToChannelNotification = ({
  onAddedToChannel,
  options,
  setChannels,
}: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = async (event: Event) => {
      if (typeof onAddedToChannel === 'function') {
        onAddedToChannel(setChannels, event, options);
      } else {
        if (!options) {
          return;
        }
        const { sort } = options;
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });

          const pinnedAtSort = findPinnedAtSortOrder({ sort });

          setChannels((channels) => {
            if (!channels) {
              return channels;
            }

            // handle pinning
            let lastPinnedChannelIndex: number | null = null;

            const newChannels = [...channels];
            if (pinnedAtSort === 1 || pinnedAtSort === -1) {
              lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
              const newTargetChannelIndex =
                typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0;

              newChannels.splice(newTargetChannelIndex, 0, channel);
              return newChannels;
            }

            return uniqBy([channel, ...channels], 'cid');
          });
        }
      }
    };

    const listener = client?.on('notification.added_to_channel', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
