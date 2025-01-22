import { useEffect } from 'react';

import type { Channel, ChannelFilters, ChannelSort, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { moveChannelUp } from '../../utils';
import {
  isChannelArchived,
  isChannelPinned,
  shouldConsiderArchivedChannels,
  shouldConsiderPinnedChannels,
} from '../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    lockChannelOrder: boolean;
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    filters?: ChannelFilters<StreamChatGenerics>;
    onNewMessage?: (
      lockChannelOrder: boolean,
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
      filters?: ChannelFilters<StreamChatGenerics>,
      sort?: ChannelSort<StreamChatGenerics>,
    ) => void;
    sort?: ChannelSort<StreamChatGenerics>;
  };

export const useNewMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  filters,
  lockChannelOrder,
  onNewMessage,
  setChannels,
  sort,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (typeof onNewMessage === 'function') {
        onNewMessage(lockChannelOrder, setChannels, event, filters, sort);
      } else {
        const considerPinnedChannels = shouldConsiderPinnedChannels(sort);
        const considerArchivedChannels = shouldConsiderArchivedChannels(filters);
        setChannels((channels) => {
          if (!channels) return channels;
          const targetChannelIndex = channels.findIndex((channel) => channel.cid === event.cid);
          const targetChannel = channels[targetChannelIndex];

          const isTargetChannelArchived = isChannelArchived(targetChannel);
          const isTargetChannelPinned = isChannelPinned(targetChannel);

          if (
            // If the channel is archived and we are not considering archived channels
            (isTargetChannelArchived && considerArchivedChannels) ||
            // If the channel is pinned and we are not considering pinned channels
            (isTargetChannelPinned && considerPinnedChannels) ||
            lockChannelOrder
          ) {
            return [...channels];
          }

          // If channel doesn't exist in existing list, check in activeChannels as well.
          // It may happen that channel was hidden using channel.hide(). In that case
          // We remove it from `channels` state, but its still being watched and exists in client.activeChannels.
          const channelToMove =
            targetChannel ??
            (event.channel_type &&
              event.channel_id &&
              client.channel(event.channel_type, event.channel_id));

          // While adding new channels, we need to consider whether they are archived or not.
          if (
            // When archived filter false, and channel is archived
            (considerArchivedChannels && isChannelArchived(channelToMove)) ||
            // When archived filter true, and channel is not archived
            (!considerArchivedChannels && !isChannelArchived(channelToMove))
          ) {
            return [...channels];
          }
          return moveChannelUp<StreamChatGenerics>({
            channels,
            channelToMove,
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
