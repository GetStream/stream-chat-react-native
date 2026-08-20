import React, { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import { Channel, ChannelFilters, ChannelOptions, SortParamRequest } from 'stream-chat';

import { ChannelListView } from './ChannelListView';
import { useCreateChannelsContext } from './hooks/useCreateChannelsContext';
import {
  ChannelListQueryChannelsOverride,
  usePaginatedChannels,
} from './hooks/usePaginatedChannels';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { SwipeRegistryProvider } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { useLazyRef } from '../../hooks/useLazyRef';
import { generateRandomId } from '../../utils/utils';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type ChannelListProps = Partial<
  Pick<
    ChannelsContextValue,
    | 'additionalFlatListProps'
    | 'setFlatListRef'
    | 'onSelect'
    | 'getChannelActionItems'
    | 'swipeActionsEnabled'
    | 'loadMoreThreshold'
    | 'maxUnreadCount'
    | 'numberOfSkeletons'
    | 'mutedStatusPosition'
    | 'pinnedStatusPosition'
  >
> & {
  /** Optional function to filter channels prior to rendering the list. Do not use any complex logic that would delay the loading of the ChannelList. We recommend using a pure function with array methods like filter/sort/reduce. */
  channelRenderFilterFn?: (channels: Array<Channel>) => Array<Channel>;
  /**
   * Object containing channel query filters
   *
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   *
   * @overrideType object
   * */
  filters?: ChannelFilters;
  /**
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder?: boolean;
  /**
   * Object containing channel query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available option fields
   * */
  options?: ChannelOptions;
  /**
   * Object containing channel sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available sorting fields
   * */
  sort?: SortParamRequest[];

  /**
   * A custom request implementation for this list's `ChannelPaginator` (its `doRequest`). Use it to
   * query a specific set of channels while still paginating over them. Call `client.queryChannels(...)`
   * inside so client state stays in sync, and return `{ items }`.
   *
   * NOTE (breaking change vs v9): this replaces the previous `queryChannelsOverride` typed as the
   * removed `QueryChannelsRequestType` (which returned `Channel[]`).
   */
  queryChannelsOverride?: ChannelListQueryChannelsOverride;
  notificationHostId?: string;
};

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT: SortParamRequest[] = [];

/**
 * This component fetches a list of channels, allowing you to select the channel you want to open.
 * The ChannelList renders a ChannelListView which provides the UI for the underlying React Native FlatList.
 *
 * @example ./ChannelList.md
 */
export const ChannelList = (props: ChannelListProps) => {
  const {
    additionalFlatListProps = {},
    channelRenderFilterFn,
    filters = DEFAULT_FILTERS,
    // https://stackoverflow.com/a/60666252/10826415
    loadMoreThreshold = 0.1,
    lockChannelOrder = false,
    maxUnreadCount = 255,
    numberOfSkeletons = 8,
    onSelect,
    options = DEFAULT_OPTIONS,
    getChannelActionItems,
    setFlatListRef,
    sort = DEFAULT_SORT,
    queryChannelsOverride,
    notificationHostId: notificationHostIdProp,
    mutedStatusPosition = 'inlineTitle',
    pinnedStatusPosition = 'inlineTitle',
    swipeActionsEnabled = true,
  } = props;

  const [forceUpdate] = useState(0);
  const fallbackNotificationHostIdRef = useLazyRef(() => `channel-list:${generateRandomId()}`);
  const notificationHostId = notificationHostIdProp ?? fallbackNotificationHostIdRef.current;
  const { client } = useChatContext();
  const channelManager = client.channelManager;
  const { NotificationList } = useComponentsContext();

  // Ref-counted on the shared manager: subscriptions live only while at least one ChannelList is mounted.
  useEffect(() => channelManager.registerSubscriptions(), [channelManager]);

  const {
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
  } = usePaginatedChannels({
    filters,
    lockChannelOrder,
    options,
    queryChannelsOverride,
    sort,
  });

  const channelsContext = useCreateChannelsContext({
    additionalFlatListProps,
    channelListInitialized,
    channels: channelRenderFilterFn ? channelRenderFilterFn(channels ?? []) : (channels ?? null),
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
    setFlatListRef: (ref: FlatList<Channel> | null) => {
      if (setFlatListRef) {
        setFlatListRef(ref);
      }
    },
    mutedStatusPosition,
    pinnedStatusPosition,
  });

  return (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel-list'>
      <ChannelsProvider value={channelsContext}>
        <SwipeRegistryProvider>
          <View style={styles.container}>
            <ChannelListView />
            <NotificationList />
          </View>
        </SwipeRegistryProvider>
      </ChannelsProvider>
    </NotificationTargetProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
