import React, { useEffect } from 'react';

import { FlatListProps, StyleSheet, View } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import type { Channel, ChannelPaginator } from 'stream-chat';

import { ChannelListView } from './ChannelListView';
import { useCreateChannelsContext } from './hooks/useCreateChannelsContext';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { SwipeRegistryProvider } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { useLazyRef } from '../../hooks/useLazyRef';
import { useStableCallback } from '../../hooks/useStableCallback';
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
   * The `ChannelPaginator` this list renders. The app creates it with the list's filters, sort and
   * request options, and registers it on `client.channelManager` with `insertPaginator` so it receives
   * events. The list loads its first page when it has none and never disposes it, so a list that
   * mounts again shows the channels it already has.
   */
  paginator: ChannelPaginator;
  notificationHostId?: string;
};

const DEFAULT_ADDITIONAL_FLAT_LIST_PROPS: Partial<FlatListProps<Channel>> = {};

/**
 * Renders the channels of an app-owned `ChannelPaginator` and lets the user select one to open.
 * The ChannelList renders a ChannelListView which provides the UI for the underlying React Native FlatList.
 *
 * @example ./ChannelList.md
 */
export const ChannelList = (props: ChannelListProps) => {
  const {
    additionalFlatListProps = DEFAULT_ADDITIONAL_FLAT_LIST_PROPS,
    channelRenderFilterFn,
    // https://stackoverflow.com/a/60666252/10826415
    loadMoreThreshold = 0.1,
    maxUnreadCount = 255,
    numberOfSkeletons = 8,
    onSelect,
    getChannelActionItems,
    setFlatListRef,
    paginator,
    notificationHostId: notificationHostIdProp,
    mutedStatusPosition = 'inlineTitle',
    pinnedStatusPosition = 'inlineTitle',
    swipeActionsEnabled = true,
  } = props;

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
  } = usePaginatedChannels({ paginator });

  const onFlatListRef = useStableCallback((ref: FlatList<Channel> | null) => {
    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  });

  const channelsContext = useCreateChannelsContext({
    additionalFlatListProps,
    loadMoreThreshold,
    loadNextPage,
    maxUnreadCount,
    numberOfSkeletons,
    onSelect,
    getChannelActionItems,
    paginator,
    swipeActionsEnabled,
    refreshList,
    reloadList,
    setFlatListRef: onFlatListRef,
    mutedStatusPosition,
    pinnedStatusPosition,
  });

  return (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel-list'>
      <ChannelsProvider value={channelsContext}>
        <SwipeRegistryProvider>
          <View style={styles.container}>
            <ChannelListView
              channelListInitialized={channelListInitialized}
              channels={
                channelRenderFilterFn ? channelRenderFilterFn(channels ?? []) : (channels ?? null)
              }
              error={error}
              hasNextPage={hasNextPage}
              loadingChannels={loadingChannels}
              loadingNextPage={loadingNextPage}
              refreshing={refreshing}
            />
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
