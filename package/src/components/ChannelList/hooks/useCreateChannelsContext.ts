import { useMemo } from 'react';

import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChannelsContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  additionalFlatListProps,
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
  PreviewStatus,
  PreviewTitle,
  PreviewUnreadCount,
  refreshing,
  refreshList,
  reloadList,
  setFlatListRef,
  Skeleton,
}: ChannelsContextValue<StreamChatClient>) => {
  const channelValueString = channels
    .map(
      (channel) =>
        `${channel.data?.name ?? ''}${channel.id ?? ''}${Object.values(channel.state.members)
          .map((member) => member.user?.online)
          .join()}`,
    )
    .join();
  const channelsContext: ChannelsContextValue<StreamChatClient> = useMemo(
    () => ({
      additionalFlatListProps,
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
      PreviewStatus,
      PreviewTitle,
      PreviewUnreadCount,
      refreshing,
      refreshList,
      reloadList,
      setFlatListRef,
      Skeleton,
    }),
    [
      channelValueString,
      error,
      forceUpdate,
      hasNextPage,
      loadingChannels,
      loadingNextPage,
      refreshing,
    ],
  );

  return channelsContext;
};
