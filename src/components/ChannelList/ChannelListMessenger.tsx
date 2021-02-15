import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

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
  Us extends UnknownType = DefaultUserType
> = Omit<
  ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  | 'hasNextPage'
  | 'HeaderErrorIndicator'
  | 'HeaderNetworkDownIndicator'
  | 'maxUnreadCount'
  | 'onSelect'
  | 'Preview'
  | 'PreviewTitle'
  | 'PreviewStatus'
  | 'PreviewAvatar'
  | 'previewMessage'
>;

const StatusIndicator = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() => {
  const { isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    error,
    HeaderErrorIndicator,
    HeaderNetworkDownIndicator,
    loadingChannels,
    refreshList,
  } = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();

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
  Us extends UnknownType = DefaultUserType
>({
  item,
}: {
  item: Channel<At, Ch, Co, Ev, Me, Re, Us>;
}) => <ChannelPreview<At, Ch, Co, Ev, Me, Re, Us> channel={item} />;

const ChannelListMessengerWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
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
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    numberOfSkeletons,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
    Skeleton,
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
        keyExtractor={(item) => item.cid}
        ListEmptyComponent={
          loading ? (
            <View style={{ backgroundColor: white_snow, flex: 1 }}>
              {Array.from(Array(numberOfSkeletons)).map((_, index) => (
                <Skeleton key={`skeleton_${index}`} />
              ))}
            </View>
          ) : (
            <EmptyStateIndicator listType='channel' />
          )
        }
        ListFooterComponent={
          loadingNextPage ? <FooterLoadingIndicator /> : undefined
        }
        ListHeaderComponent={() =>
          channels.length && ListHeaderComponent ? (
            <ListHeaderComponent />
          ) : null
        }
        onEndReached={() => {
          if (loadNextPage) {
            loadNextPage();
          }
        }}
        onEndReachedThreshold={loadMoreThreshold}
        ref={setFlatListRef}
        refreshControl={
          <RefreshControl onRefresh={refreshList} refreshing={refreshing} />
        }
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
  Us extends UnknownType = DefaultUserType
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
  Us extends UnknownType = DefaultUserType
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
    numberOfSkeletons,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
    Skeleton,
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
        numberOfSkeletons,
        refreshing,
        refreshList,
        reloadList,
        setFlatListRef,
        Skeleton,
      }}
      {...props}
    />
  );
};

ChannelListMessenger.displayName = 'ChannelListMessenger{channelListMessenger}';
