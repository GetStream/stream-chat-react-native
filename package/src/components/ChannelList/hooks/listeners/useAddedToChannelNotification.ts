import { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type {
  ChannelListEventListenerOptions,
  DefaultStreamChatGenerics,
} from '../../../../types/types';
import { getChannel } from '../../utils';
import { findLastPinnedChannelIndex, findPinnedAtSortOrder } from '../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onAddedToChannel?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
      options?: ChannelListEventListenerOptions<StreamChatGenerics>,
    ) => void;
    options?: ChannelListEventListenerOptions<StreamChatGenerics>;
  };

export const useAddedToChannelNotification = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onAddedToChannel,
  options,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onAddedToChannel === 'function') {
        onAddedToChannel(setChannels, event, options);
      } else {
        if (!options) return;
        const { sort } = options;
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel<StreamChatGenerics>({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });

          const pinnedAtSort = findPinnedAtSortOrder({ sort });

          setChannels((channels) => {
            if (!channels) return channels;

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
