import React, { useEffect, useMemo, useRef, useState } from 'react';
// RNGR's FlatList ist currently breaking the pull-to-refresh behaviour on Android
// See https://github.com/software-mansion/react-native-gesture-handler/issues/598
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

/**
 * The list's query state, passed down by `ChannelList`.
 */
export type ChannelListState = {
  /**
   * A control prop used to determine whether the first query of the channel list has succeeded.
   */
  channelListInitialized: boolean;
  /**
   * The channels to render.
   */
  channels: Channel[] | null;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage: boolean;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels: boolean;
  /**
   * Whether or not additional channels are being loaded, triggers the
   * ChannelListFooterLoadingIndicator
   */
  loadingNextPage: boolean;
  /**
   * Triggered when the channel list is refreshing, displays a loading spinner at the top of the list
   */
  refreshing: boolean;
  /**
   * Error in channels query, if any
   */
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

  // `=== false` for the network (unknown must not read as offline), plain falsy for the socket
  // (always a boolean).
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
  const onEndReachedCalledDuringCurrentScrollRef = useRef<boolean>(false);
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

  /**
   * In order to prevent the EmptyStateIndicator component from showing up briefly on mount,
   * we set the loading state one cycle behind to ensure the channels are set before the
   * change to loadingChannels is registered.
   */
  const [loading, setLoading] = useState(true);
  const styles = useStyles();

  useEffect(() => {
    if (!!loadingChannels !== loading) {
      setLoading(!!loadingChannels);
    }
  }, [loading, loadingChannels]);

  const onEndReached = useStableCallback(() => {
    if (!onEndReachedCalledDuringCurrentScrollRef.current && hasNextPage) {
      loadNextPage();
      onEndReachedCalledDuringCurrentScrollRef.current = true;
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
          loading ? <LoadingIndicator /> : <EmptyStateIndicator listType='channel' />
        }
        ListFooterComponent={loadingNextPage ? <ChannelListFooterLoadingIndicator /> : undefined}
        ListHeaderComponent={ListHeaderComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={loadMoreThreshold}
        onMomentumScrollBegin={() => (onEndReachedCalledDuringCurrentScrollRef.current = false)}
        onRefresh={refreshList}
        ref={setFlatListRef}
        refreshing={refreshing}
        renderItem={renderItem}
        // Rows subscribe to their own channel, so a list update re-renders only the cells it changed.
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
 * This UI component displays the preview list of channels and handles Channel navigation. It
 * receives all props from the ChannelList component.
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
