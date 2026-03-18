import React, { useEffect, useMemo, useRef, useState } from 'react';
// RNGR's FlatList ist currently breaking the pull-to-refresh behaviour on Android
// See https://github.com/software-mansion/react-native-gesture-handler/issues/598
import { FlatList, StyleSheet, View } from 'react-native';

import type { Channel } from 'stream-chat';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useDebugContext } from '../../contexts/debugContext/DebugContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import { useStableCallback } from '../../hooks';
import { ChannelPreview } from '../ChannelPreview/ChannelPreview';

export type ChannelListMessengerPropsWithContext = Omit<
  ChannelsContextValue,
  | 'HeaderErrorIndicator'
  | 'HeaderNetworkDownIndicator'
  | 'maxUnreadCount'
  | 'numberOfSkeletons'
  | 'onSelect'
  | 'Preview'
  | 'PreviewTitle'
  | 'PreviewStatus'
  | 'PreviewAvatar'
  | 'previewMessage'
  | 'Skeleton'
>;

const StatusIndicator = () => {
  const { isOnline } = useChatContext();
  const styles = useStyles();
  const { error, HeaderErrorIndicator, HeaderNetworkDownIndicator, loadingChannels, refreshList } =
    useChannelsContext();

  if (loadingChannels) {
    return null;
  }

  if (!isOnline) {
    return (
      <View style={styles.statusIndicator}>
        <HeaderNetworkDownIndicator />
      </View>
    );
  } else if (error) {
    return (
      <View style={styles.statusIndicator}>
        <HeaderErrorIndicator onPress={refreshList} />
      </View>
    );
  }
  return null;
};

const renderItem = ({ item }: { item: Channel }) => <ChannelPreview channel={item} />;

const keyExtractor = (item: Channel) => item.cid;

const ChannelListMessengerWithContext = (props: ChannelListMessengerPropsWithContext) => {
  const onEndReachedCalledDuringCurrentScrollRef = useRef<boolean>(false);
  const {
    additionalFlatListProps,
    channelListInitialized,
    channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
    hasNextPage,
    ListHeaderComponent,
    loadingChannels,
    LoadingErrorIndicator,
    LoadingIndicator,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
  } = props;

  /**
   * In order to prevent the EmptyStateIndicator component from showing up briefly on mount,
   * we set the loading state one cycle behind to ensure the channels are set before the
   * change to loadingChannels is registered.
   */
  const [loading, setLoading] = useState(true);
  const debugRef = useDebugContext();
  const styles = useStyles();

  useEffect(() => {
    if (!!loadingChannels !== loading) {
      setLoading(!!loadingChannels);
    }
  }, [loading, loadingChannels]);

  const isDebugModeEnabled = __DEV__ && debugRef && debugRef.current;

  if (isDebugModeEnabled) {
    if (debugRef.current.setEventType) {
      debugRef.current.setEventType('send');
    }
    if (debugRef.current.setSendEventParams) {
      debugRef.current.setSendEventParams({
        action: 'Channels',
        data: channels?.map((channel) => ({
          data: channel.data,
          members: channel.state.members,
        })),
      });
    }
  }

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
        data={channels}
        extraData={forceUpdate}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          loading ? (
            <LoadingIndicator listType='channel' />
          ) : (
            <EmptyStateIndicator listType='channel' />
          )
        }
        ListFooterComponent={loadingNextPage ? <FooterLoadingIndicator /> : undefined}
        ListHeaderComponent={ListHeaderComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={loadMoreThreshold}
        onMomentumScrollBegin={() => (onEndReachedCalledDuringCurrentScrollRef.current = false)}
        onRefresh={refreshList}
        ref={setFlatListRef}
        refreshing={refreshing}
        renderItem={renderItem}
        style={styles.flatList}
        testID='channel-list-messenger'
        {...additionalFlatListProps}
      />
      <StatusIndicator />
    </>
  );
};

export type ChannelListMessengerProps = Partial<ChannelListMessengerPropsWithContext>;

/**
 * This UI component displays the preview list of channels and handles Channel navigation. It
 * receives all props from the ChannelList component.
 *
 * @example ./ChannelListMessenger.md
 */
export const ChannelListMessenger = (props: ChannelListMessengerProps) => {
  const {
    additionalFlatListProps,
    channelListInitialized,
    channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
    hasNextPage,
    ListHeaderComponent,
    loadingChannels,
    LoadingErrorIndicator,
    LoadingIndicator,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
  } = useChannelsContext();

  return (
    <ChannelListMessengerWithContext
      {...{
        additionalFlatListProps,
        channelListInitialized,
        channels,
        EmptyStateIndicator,
        error,
        FooterLoadingIndicator,
        forceUpdate,
        hasNextPage,
        ListHeaderComponent,
        loadingChannels,
        LoadingErrorIndicator,
        LoadingIndicator,
        loadingNextPage,
        loadMoreThreshold,
        loadNextPage,
        refreshing,
        refreshList,
        reloadList,
        setFlatListRef,
      }}
      {...props}
    />
  );
};

ChannelListMessenger.displayName = 'ChannelListMessenger{channelListMessenger}';

const useStyles = () => {
  const {
    theme: {
      channelListMessenger: { flatList, flatListContent },
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      flatList: { flex: 1, ...flatList },
      flatListContentContainer: {
        flexGrow: 1,
        ...flatListContent,
      },
      statusIndicator: { left: 0, position: 'absolute', right: 0, top: 0 },
    });
  }, [flatList, flatListContent]);
};
