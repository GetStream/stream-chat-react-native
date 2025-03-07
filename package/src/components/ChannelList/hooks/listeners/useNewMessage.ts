import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { ChannelListEventListenerOptions } from '../../../../types/types';
import { moveChannelUp } from '../../utils';
import {
  isChannelArchived,
  isChannelPinned,
  shouldConsiderArchivedChannels,
  shouldConsiderPinnedChannels,
} from '../utils';

type Parameters = {
  lockChannelOrder: boolean;
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  onNewMessage?: (
    lockChannelOrder: boolean,
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  options?: ChannelListEventListenerOptions;
};

export const useNewMessage = ({
  lockChannelOrder,
  onNewMessage,
  options,
  setChannels,
}: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (typeof onNewMessage === 'function') {
        onNewMessage(lockChannelOrder, setChannels, event, options);
      } else {
        if (!options) {
          return;
        }
        const { filters, sort } = options;
        const considerPinnedChannels = shouldConsiderPinnedChannels(sort);
        const considerArchivedChannels = shouldConsiderArchivedChannels(filters);

        const channelType = event.channel_type;
        const channelId = event.channel_id;

        if (!channelType || !channelId) {
          return;
        }

        setChannels((channels) => {
          if (!channels) {
            return channels;
          }
          const targetChannel = client.channel(channelType, channelId);
          const targetChannelIndex = channels.indexOf(targetChannel);

          const isTargetChannelArchived = isChannelArchived(targetChannel);
          const isTargetChannelPinned = isChannelPinned(targetChannel);

          if (
            // When archived filter false, and channel is archived
            (considerArchivedChannels && isTargetChannelArchived && !filters?.archived) ||
            // When archived filter true, and channel is unarchived
            (considerArchivedChannels && !isTargetChannelArchived && filters?.archived) ||
            // If the channel is pinned and we are not considering pinned channels
            (isTargetChannelPinned && considerPinnedChannels) ||
            lockChannelOrder
          ) {
            return [...channels];
          }

          return moveChannelUp({
            channels,
            channelToMove: targetChannel,
            channelToMoveIndexWithinChannels: targetChannelIndex,
            sort,
          });
        });
      }
    };

    const listener = client?.on('message.new', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
