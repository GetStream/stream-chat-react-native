import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type {
  ChannelListEventListenerOptions,
  DefaultStreamChatGenerics,
} from '../../../../types/types';
import {
  findLastPinnedChannelIndex,
  findPinnedAtSortOrder,
  isChannelArchived,
  isChannelPinned,
  shouldConsiderArchivedChannels,
  shouldConsiderPinnedChannels,
} from '../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    lockChannelOrder: boolean;
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>;
    onChannelMemberUpdated?: (
      lockChannelOrder: boolean,
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>,
      event: Event<StreamChatGenerics>,
      options?: ChannelListEventListenerOptions<StreamChatGenerics>,
    ) => void;
    options?: ChannelListEventListenerOptions<StreamChatGenerics>;
  };

export const useChannelMemberUpdated = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  lockChannelOrder,
  onChannelMemberUpdated,
  options,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (typeof onChannelMemberUpdated === 'function') {
        onChannelMemberUpdated(lockChannelOrder, setChannels, event, options);
      } else {
        if (!options) return;
        const { filters, sort } = options;
        if (!event.member?.user || event.member.user.id !== client.userID || !event.channel_type) {
          return;
        }
        const channelType = event.channel_type;
        const channelId = event.channel_id;

        const considerPinnedChannels = shouldConsiderPinnedChannels(sort);
        const considerArchivedChannels = shouldConsiderArchivedChannels(filters);
        const pinnedAtSort = findPinnedAtSortOrder({ sort });

        setChannels((currentChannels) => {
          if (!currentChannels) return currentChannels;

          const targetChannel = client.channel(channelType, channelId);
          // assumes that channel instances are not changing
          const targetChannelIndex = currentChannels.indexOf(targetChannel);
          const targetChannelExistsWithinList = targetChannelIndex >= 0;

          const isTargetChannelPinned = isChannelPinned(targetChannel);
          const isTargetChannelArchived = isChannelArchived(targetChannel);

          if (!considerPinnedChannels || lockChannelOrder) {
            return currentChannels;
          }

          const newChannels = [...currentChannels];

          if (targetChannelExistsWithinList) {
            newChannels.splice(targetChannelIndex, 1);
          }

          // handle archiving (remove channel)
          if (
            // When archived filter true, and channel is unarchived
            (considerArchivedChannels && !isTargetChannelArchived && filters?.archived) ||
            // When archived filter false, and channel is archived
            (considerArchivedChannels && isTargetChannelArchived && !filters?.archived)
          ) {
            return newChannels;
          }

          // handle pinning
          let lastPinnedChannelIndex: number | null = null;

          if (pinnedAtSort === 1 || (pinnedAtSort === -1 && !isTargetChannelPinned)) {
            lastPinnedChannelIndex = findLastPinnedChannelIndex({ channels: newChannels });
          }
          const newTargetChannelIndex =
            typeof lastPinnedChannelIndex === 'number' ? lastPinnedChannelIndex + 1 : 0;

          // skip re-render if the position of the channel does not change
          if (currentChannels[newTargetChannelIndex] === targetChannel) {
            return currentChannels;
          }

          newChannels.splice(newTargetChannelIndex, 0, targetChannel);

          return newChannels;
        });
      }
    };

    const listener = client?.on('member.updated', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
