import { useMemo } from 'react';

import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChannelsContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
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
}: ChannelsContextValue<StreamChatGenerics>) => {
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
  const channelsContext: ChannelsContextValue<StreamChatGenerics> = useMemo(
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
