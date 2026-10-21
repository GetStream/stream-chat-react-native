import React, { useMemo } from 'react';
// The gesture handler's FlatList breaks pull-to-refresh on Android.
import { FlatList, StyleSheet, View } from 'react-native';

import type { Channel } from 'stream-chat';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { useStableCallback } from '../../hooks';
import { ChannelPreview } from '../ChannelPreview/ChannelPreview';
import { useNetworkConnectionState } from '../Chat/hooks/useNetworkConnectionState';
import { useSettledWSConnectionHealth } from '../Chat/hooks/useWSConnectionState';

/** The list's query state, passed down by `ChannelList`. */
export type ChannelListState = {
  /** Whether the first page of channels has loaded. */
  channelListInitialized: boolean;
  /** The channels to render. */
  channels: Channel[] | null;
  /** Whether another page of channels can be loaded. */
  hasNextPage: boolean;
  /** Whether the initial channels query is loading, which shows the loading indicator. */
  loadingChannels: boolean;
  /** Whether the next page is loading, which shows `ChannelListFooterLoadingIndicator`. */
  loadingNextPage: boolean;
  /** Whether a pull-to-refresh is in progress, shown as a spinner at the top of the list. */
  refreshing: boolean;
  /** Error of the channels query, if any. */
  error?: Error;
};

export type ChannelListViewPropsWithContext = Omit<
  ChannelsContextValue,
  'maxUnreadCount' | 'numberOfSkeletons' | 'onSelect'
> &
  ChannelListState;

const StatusIndicator = ({
  error,
  loadingChannels,
  refreshList,
}: Pick<ChannelListViewPropsWithContext, 'error' | 'loadingChannels' | 'refreshList'>) => {
  const isNetworkOnline = useNetworkConnectionState()?.isOnline;
  const isWSOnline = useSettledWSConnectionHealth();
  const styles = useStyles();
  const { ChannelListHeaderErrorIndicator, ChannelListHeaderNetworkDownIndicator } =
    useComponentsContext();

  if (loadingChannels) {
    return null;
  }

  // `=== false` for the network, as an unknown status must not read as offline. The socket status
  // is always a boolean.
  if (isNetworkOnline === false || !isWSOnline) {
    return (
      <View style={styles.statusIndicator}>
        <ChannelListHeaderNetworkDownIndicator />
      </View>
    );
  } else if (error) {
    return (
      <View style={styles.statusIndicator}>
        <ChannelListHeaderErrorIndicator onPress={refreshList} />
      </View>
    );
  }
  return null;
};

const renderItem = ({ item }: { item: Channel }) => <ChannelPreview channel={item} />;

const keyExtractor = (item: Channel) => item.cid;

const ChannelListViewWithContext = (props: ChannelListViewPropsWithContext) => {
  const {
    additionalFlatListProps,
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
  } = props;
  const {
    EmptyStateIndicator,
    ChannelListFooterLoadingIndicator,
    ListHeaderComponent,
    LoadingErrorIndicator,
    ChannelListLoadingIndicator: LoadingIndicator,
  } = useComponentsContext();

  const styles = useStyles();

  const onEndReached = useStableCallback(() => {
    if (hasNextPage) {
      loadNextPage();
    }
  });

  if (error && !refreshing && !loadingChannels && (channels === null || !channelListInitialized)) {
    return (
      <LoadingErrorIndicator
        error={error}
        listType='channel'
        loadNextPage={loadNextPage}
        retry={reloadList}
      />
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.flatListContentContainer}
        data={channels ?? undefined}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          loadingChannels ? <LoadingIndicator /> : <EmptyStateIndicator listType='channel' />
        }
        ListFooterComponent={loadingNextPage ? <ChannelListFooterLoadingIndicator /> : undefined}
        ListHeaderComponent={ListHeaderComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={loadMoreThreshold}
        onRefresh={refreshList}
        ref={setFlatListRef}
        refreshing={refreshing}
        renderItem={renderItem}
        // Rows subscribe to their own channel, so a list update re-renders only the changed cells.
        strictMode
        style={styles.flatList}
        testID='channel-list-view'
        {...additionalFlatListProps}
      />
      <StatusIndicator error={error} loadingChannels={loadingChannels} refreshList={refreshList} />
    </>
  );
};

export type ChannelListViewProps = Partial<
  Omit<ChannelListViewPropsWithContext, keyof ChannelListState>
> &
  ChannelListState;

/**
 * The preview list of channels, rendered by `ChannelList` with its state.
 *
 * @example ./ChannelListView.md
 */
export const ChannelListView = (props: ChannelListViewProps) => {
  const {
    additionalFlatListProps,
    loadMoreThreshold,
    loadNextPage,
    paginator,
    refreshList,
    reloadList,
    setFlatListRef,
  } = useChannelsContext();

  return (
    <ChannelListViewWithContext
      {...{
        additionalFlatListProps,
        loadMoreThreshold,
        loadNextPage,
        paginator,
        refreshList,
        reloadList,
        setFlatListRef,
      }}
      {...props}
    />
  );
};

ChannelListView.displayName = 'ChannelListView{channelListView}';

const useStyles = () => {
  const {
    theme: {
      semantics,
      channelListView: { flatList, flatListContent },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      flatList: {
        flex: 1,
        backgroundColor: semantics.backgroundCoreApp,
        ...flatList,
      },
      flatListContentContainer: {
        flexGrow: 1,
        backgroundColor: semantics.backgroundCoreApp,
        ...flatListContent,
      },
      statusIndicator: { left: 0, position: 'absolute', right: 0, top: 0 },
    });
  }, [flatList, flatListContent, semantics]);
};
