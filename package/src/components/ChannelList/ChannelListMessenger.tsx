import React, { useEffect, useState } from 'react';
// RNGR's FlatList ist currently breaking the pull-to-refresh behaviour on Android
// See https://github.com/software-mansion/react-native-gesture-handler/issues/598
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Channel, ExtendableGenerics } from 'stream-chat';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ChannelPreview } from '../ChannelPreview/ChannelPreview';

const styles = StyleSheet.create({
  flatList: { flex: 1 },
  flatListContentContainer: { flexGrow: 1 },
  statusIndicator: { left: 0, position: 'absolute', right: 0, top: 0 },
});

export type ChannelListMessengerPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Omit<
  ChannelsContextValue<StreamChatClient>,
  | 'hasNextPage'
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

const StatusIndicator = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() => {
  const { isOnline } = useChatContext<StreamChatClient>();
  const { error, HeaderErrorIndicator, HeaderNetworkDownIndicator, loadingChannels, refreshList } =
    useChannelsContext<StreamChatClient>();

  if (loadingChannels) return null;

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

const renderItem = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>({
  item,
}: {
  item: Channel<StreamChatClient>;
}) => <ChannelPreview<StreamChatClient> channel={item} />;

const keyExtractor = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  item: Channel<StreamChatClient>,
) => item.cid;

const ChannelListMessengerWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelListMessengerPropsWithContext<StreamChatClient>,
) => {
  const {
    additionalFlatListProps,
    channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
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

  const {
    theme: {
      channelListMessenger: { flatList, flatListContent },
      colors: { white_snow },
    },
  } = useTheme();

  /**
   * In order to prevent the EmptyStateIndicator component from showing up briefly on mount,
   * we set the loading state one cycle behind to ensure the channels are set before the
   * change to loadingChannels is registered.
   */
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!!loadingChannels !== loading) {
      setLoading(!!loadingChannels);
    }
  }, [loading, loadingChannels]);

  if (error && !refreshing && !loadingChannels && !channels?.length) {
    return (
      <LoadingErrorIndicator
        error={error}
        listType='channel'
        loadNextPage={loadNextPage}
        retry={reloadList}
      />
    );
  }

  const onEndReached = () => {
    if (loadNextPage) {
      loadNextPage();
    }
  };

  const ListFooterComponent = () =>
    channels.length && ListHeaderComponent ? <ListHeaderComponent /> : null;

  return (
    <>
      <FlatList
        contentContainerStyle={[
          styles.flatListContentContainer,
          { backgroundColor: white_snow },
          flatListContent,
        ]}
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
        ListHeaderComponent={ListFooterComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={loadMoreThreshold}
        // @ts-expect-error waiting for this merged PR to be released https://github.com/software-mansion/react-native-gesture-handler/pull/1394
        ref={setFlatListRef}
        refreshControl={<RefreshControl onRefresh={refreshList} refreshing={refreshing} />}
        renderItem={renderItem}
        style={[styles.flatList, { backgroundColor: white_snow }, flatList]}
        testID='channel-list-messenger'
        {...additionalFlatListProps}
      />
      <StatusIndicator<StreamChatClient> />
    </>
  );
};

export type ChannelListMessengerProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<ChannelListMessengerPropsWithContext<StreamChatClient>>;

/**
 * This UI component displays the preview list of channels and handles Channel navigation. It
 * receives all props from the ChannelList component.
 *
 * @example ./ChannelListMessenger.md
 */
export const ChannelListMessenger = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelListMessengerProps<StreamChatClient>,
) => {
  const {
    additionalFlatListProps,
    channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
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
  } = useChannelsContext<StreamChatClient>();

  return (
    <ChannelListMessengerWithContext
      {...{
        additionalFlatListProps,
        channels,
        EmptyStateIndicator,
        error,
        FooterLoadingIndicator,
        forceUpdate,
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
