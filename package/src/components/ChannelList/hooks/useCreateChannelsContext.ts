import { useMemo } from 'react';

import type { ChannelsContextValue } from '../../../contexts/channelsContext/ChannelsContext';

export const useCreateChannelsContext = ({
  additionalFlatListProps,
  getChannelActionItems,
  loadMoreThreshold,
  loadNextPage,
  maxUnreadCount,
  mutedStatusPosition,
  numberOfSkeletons,
  onSelect,
  paginator,
  pinnedStatusPosition,
  refreshList,
  reloadList,
  setFlatListRef,
  swipeActionsEnabled,
}: ChannelsContextValue) =>
  useMemo<ChannelsContextValue>(
    () => ({
      additionalFlatListProps,
      getChannelActionItems,
      loadMoreThreshold,
      loadNextPage,
      maxUnreadCount,
      mutedStatusPosition,
      numberOfSkeletons,
      onSelect,
      paginator,
      pinnedStatusPosition,
      refreshList,
      reloadList,
      setFlatListRef,
      swipeActionsEnabled,
    }),
    [
      additionalFlatListProps,
      getChannelActionItems,
      loadMoreThreshold,
      loadNextPage,
      maxUnreadCount,
      mutedStatusPosition,
      numberOfSkeletons,
      onSelect,
      paginator,
      pinnedStatusPosition,
      refreshList,
      reloadList,
      setFlatListRef,
      swipeActionsEnabled,
    ],
  );
