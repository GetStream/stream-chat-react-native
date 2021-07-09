import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ChannelPreview } from '../ChannelPreview/ChannelPreview';

import { useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { Channel } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const styles = StyleSheet.create({
  flatList: { flex: 1 },
  flatListContentContainer: { flexGrow: 1 },
  statusIndicator: { left: 0, position: 'absolute', right: 0, top: 0 },
});

export type ChannelListMessengerPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Omit<
  ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>,
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>() => {
  const { isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { error, HeaderErrorIndicator, HeaderNetworkDownIndicator, loadingChannels, refreshList } =
    useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

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

const renderItem = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>({
  item,
}: {
  item: Channel<At, Ch, Co, Ev, Me, Re, Us>;
}) => <ChannelPreview<At, Ch, Co, Ev, Me, Re, Us> channel={item} />;

const keyExtractor = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  item: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => item.cid;

const ChannelListMessengerWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: ChannelListMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
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
      <StatusIndicator<At, Ch, Co, Ev, Me, Re, Us> />
    </>
  );
};

export type ChannelListMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<ChannelListMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 * This UI component displays the preview list of channels and handles Channel navigation. It
 * receives all props from the ChannelList component.
 *
 * @example ./ChannelListMessenger.md
 */
export const ChannelListMessenger = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: ChannelListMessengerProps<At, Ch, Co, Ev, Me, Re, Us>,
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
  } = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

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
