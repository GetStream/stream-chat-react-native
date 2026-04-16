import { useMemo } from 'react';

import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';

export const useCreateChannelsContext = ({
  additionalFlatListProps,
  channelListInitialized,
  channels,
  error,
  forceUpdate,
  hasNextPage,
  loadingChannels,
  loadingNextPage,
  loadMoreThreshold,
  loadNextPage,
  maxUnreadCount,
  numberOfSkeletons,
  onSelect,
  getChannelActionItems,
  swipeActionsEnabled,
  refreshing,
  refreshList,
  reloadList,
  setFlatListRef,
  mutedStatusPosition,
}: ChannelsContextValue) => {
  const channelValueString = channels
    ?.map(
      (channel) =>
        `${channel.data?.name ?? ''}${channel.id ?? ''}${
          channel?.state?.unreadCount ?? ''
        }${Object.values(channel.state.members)
          .map((member) => member.user?.online)
          .join()}`,
    )
    .join();
  const channelsContext: ChannelsContextValue = useMemo(
    () => ({
      additionalFlatListProps,
      channelListInitialized,
      channels,
      error,
      forceUpdate,
      hasNextPage,
      loadingChannels,
      loadingNextPage,
      loadMoreThreshold,
      loadNextPage,
      maxUnreadCount,
      numberOfSkeletons,
      onSelect,
      getChannelActionItems,
      swipeActionsEnabled,
      refreshing,
      refreshList,
      reloadList,
      setFlatListRef,
      mutedStatusPosition,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      channelValueString,
      error,
      forceUpdate,
      hasNextPage,
      loadingChannels,
      loadingNextPage,
      channelListInitialized,
      swipeActionsEnabled,
      refreshing,
      mutedStatusPosition,
    ],
  );

  return channelsContext;
};
