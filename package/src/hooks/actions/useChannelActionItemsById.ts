import { useMemo } from 'react';

import type { Channel } from 'stream-chat';

import type {
  ChannelActionItem,
  ChannelActionSurface,
  GetChannelActionItems,
} from './useChannelActionItems';
import { useChannelActionItems } from './useChannelActionItems';

export type ChannelActionItemsById = Partial<Record<ChannelActionItem['id'], ChannelActionItem>>;

type UseChannelActionItemsByIdParams = {
  channel: Channel;
  surface?: ChannelActionSurface;
  getChannelActionItems?: GetChannelActionItems;
};

export const useChannelActionItemsById = ({
  channel,
  surface,
  getChannelActionItems,
}: UseChannelActionItemsByIdParams) => {
  const channelActionItems = useChannelActionItems({
    channel,
    getChannelActionItems,
    surface,
  });

  return useMemo(
    () =>
      channelActionItems.reduce<ChannelActionItemsById>((acc, channelActionItem) => {
        acc[channelActionItem.id] = channelActionItem;
        return acc;
      }, {}),
    [channelActionItems],
  );
};
