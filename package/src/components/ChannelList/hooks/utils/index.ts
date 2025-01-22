import { Channel, ChannelSortBase } from 'stream-chat';

import { DefaultStreamChatGenerics } from '../../../../types/types';
import { ChannelListProps } from '../../ChannelList';

export const isChannelPinned = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.pinned_at;
};

export const isChannelArchived = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  if (!channel) return false;

  const member = channel.state.membership;

  return !!member?.archived_at;
};

export const shouldConsiderArchivedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  filters: ChannelListProps<StreamChatGenerics>['filters'],
) => {
  if (!filters) return false;

  return !filters.archived;
};

export const extractSortValue = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  atIndex,
  sort,
  targetKey,
}: {
  atIndex: number;
  targetKey: keyof ChannelSortBase<StreamChatGenerics>;
  sort?: ChannelListProps<StreamChatGenerics>['sort'];
}) => {
  if (!sort) return null;
  let option: null | ChannelSortBase<StreamChatGenerics> = null;

  if (Array.isArray(sort)) {
    option = sort[atIndex] ?? null;
  } else {
    let index = 0;
    for (const key in sort) {
      if (index !== atIndex) {
        index++;
        continue;
      }

      if (key !== targetKey) {
        return null;
      }

      option = sort;

      break;
    }
  }

  return option?.[targetKey] ?? null;
};

/**
 * Returns true only if `{ pinned_at: -1 }` or `{ pinned_at: 1 }` option is first within the `sort` array.
 */
export const shouldConsiderPinnedChannels = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  sort: ChannelListProps<StreamChatGenerics>['sort'],
) => {
  const value = extractSortValue({
    atIndex: 0,
    sort,
    targetKey: 'pinned_at',
  });

  if (typeof value !== 'number') return false;

  return Math.abs(value) === 1;
};

export function findPinnedAtSortOrder<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({ sort }: { sort: ChannelListProps<StreamChatGenerics>['sort'] }) {
  if (!sort) return null;

  if (Array.isArray(sort)) {
    const [option] = sort;

    if (!option?.pinned_at) return null;

    return option.pinned_at;
  } else {
    if (!sort.pinned_at) return null;

    return sort.pinned_at;
  }
}

export function findLastPinnedChannelIndex<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({ channels }: { channels: Channel<StreamChatGenerics>[] }) {
  let lastPinnedChannelIndex: number | null = null;

  for (const channel of channels) {
    if (!isChannelPinned(channel)) break;

    if (typeof lastPinnedChannelIndex === 'number') {
      lastPinnedChannelIndex++;
    } else {
      lastPinnedChannelIndex = 0;
    }
  }

  return lastPinnedChannelIndex;
}
