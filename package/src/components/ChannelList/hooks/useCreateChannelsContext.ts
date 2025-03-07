import { useMemo } from 'react';

import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';

export const useCreateChannelsContext = ({
  additionalFlatListProps,
  channelListInitialized,
  channels,
  EmptyStateIndicator,
  error,
  FooterLoadingIndicator,
  forceUpdate,
  hasNextPage,
  HeaderErrorIndicator,
  HeaderNetworkDownIndicator,
  ListHeaderComponent,
  loadingChannels,
  LoadingErrorIndicator,
  LoadingIndicator,
  loadingNextPage,
  loadMoreThreshold,
  loadNextPage,
  maxUnreadCount,
  numberOfSkeletons,
  onSelect,
  Preview,
  PreviewAvatar,
  PreviewMessage,
  PreviewMutedStatus,
  PreviewStatus,
  PreviewTitle,
  PreviewUnreadCount,
  refreshing,
  refreshList,
  reloadList,
  setFlatListRef,
  Skeleton,
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
      EmptyStateIndicator,
      error,
      FooterLoadingIndicator,
      forceUpdate,
      hasNextPage,
      HeaderErrorIndicator,
      HeaderNetworkDownIndicator,
      ListHeaderComponent,
      loadingChannels,
      LoadingErrorIndicator,
      LoadingIndicator,
      loadingNextPage,
      loadMoreThreshold,
      loadNextPage,
      maxUnreadCount,
      numberOfSkeletons,
      onSelect,
      Preview,
      PreviewAvatar,
      PreviewMessage,
      PreviewMutedStatus,
      PreviewStatus,
      PreviewTitle,
      PreviewUnreadCount,
      refreshing,
      refreshList,
      reloadList,
      setFlatListRef,
      Skeleton,
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
      refreshing,
    ],
  );

  return channelsContext;
};
