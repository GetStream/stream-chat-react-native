import React from 'react';
import { FlatList } from 'react-native';
import type { Channel, UnknownType } from 'stream-chat';

import ChannelListFooterLoadingIndicator from './ChannelListFooterLoadingIndicator';
import ChannelListHeaderErrorIndicator from './ChannelListHeaderErrorIndicator';
import ChannelListHeaderNetworkDownIndicator from './ChannelListHeaderNetworkDownIndicator';
import ChannelPreview from '../ChannelPreview/ChannelPreview';
import EmptyStateIndicatorDefault from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault from '../Indicators/LoadingIndicator';

import { useChatContext } from '../../contexts/chatContext/ChatContext';

import type { ChannelListProps } from './ChannelList';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelListMessengerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = ChannelListProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /**
   * Channels can be either an array of channels or a promise which resolves to an array of channels
   */
  channels: Channel<At, Ch, Co, Ev, Me, Re, Us>[];
  /**
   * Error in channels query, if any
   * */
  error?: boolean;
  /**
   * Incremental number change to force update the FlatList
   */
  forceUpdate?: number;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage?: boolean;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels?: boolean;
  /**
   * Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
   * */
  loadingNextPage?: boolean;
  /**
   * Loads the next page of `channels`, which is present as a required prop
   * */
  loadNextPage?: () => Promise<void> | null;
  /**
   * Triggered when the channel list is refreshing, displays a loading spinner at the top of the list
   * */
  refreshing?: boolean;
  /**
   * Function to refresh the channel list that is similar to `reloadList`, but it doesn't wipe out existing channels
   * from UI before loading the new ones
   */
  refreshList?: () => Promise<void>;

  /**
   * Removes all the existing channels from UI and loads fresh channels
   * */
  reloadList?: () => Promise<void>;
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   * */
  setActiveChannel?: (channel: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
  /**
   * Function to gain access to the inner FlatList ref
   *
   * **Example:**
   *
   * ```
   * <ChannelListMessenger
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef?: (
    ref: FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null,
  ) => void;
};

/**
 * This UI component displays the preview list of channels and handles Channel navigation.
 *
 * @example ../docs/ChannelListMessenger.md
 */
const ChannelListMessenger = <
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
    additionalFlatListProps = {},
    channels,
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    error,
    FooterLoadingIndicator = ChannelListFooterLoadingIndicator,
    forceUpdate,
    loadingChannels,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
    loadingNextPage,
    // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
    loadMoreThreshold = 2,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef,
  } = props;

  const { isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const renderHeaderIndicator = () => {
    const {
      HeaderErrorIndicator = ChannelListHeaderErrorIndicator,
      HeaderNetworkDownIndicator = ChannelListHeaderNetworkDownIndicator,
    } = props;
    if (!isOnline) {
      return <HeaderNetworkDownIndicator />;
    } else if (error) {
      return <HeaderErrorIndicator onPress={refreshList} />;
    }
    return null;
  };

  const renderItem = (channel: Channel<At, Ch, Co, Ev, Me, Re, Us>) => (
    <ChannelPreview<At, Ch, Co, Ev, Me, Re, Us> {...props} channel={channel} />
  );

  const renderChannels = () => (
    <>
      {renderHeaderIndicator()}
      <FlatList
        data={channels}
        extraData={forceUpdate}
        keyExtractor={(item) => item.cid}
        ListEmptyComponent={() => <EmptyStateIndicator listType='channel' />}
        ListFooterComponent={() =>
          loadingNextPage ? <FooterLoadingIndicator /> : null
        }
        onEndReached={loadNextPage}
        onEndReachedThreshold={loadMoreThreshold}
        onRefresh={refreshList}
        ref={(flRef) => {
          setFlatListRef && setFlatListRef(flRef);
        }}
        refreshing={refreshing}
        renderItem={({ item }) => renderItem(item)}
        testID='channel-list-messenger'
        {...additionalFlatListProps}
      />
    </>
  );

  if (error && !refreshing && !(channels && channels.length)) {
    return (
      <LoadingErrorIndicator
        error={error}
        listType='channel'
        loadNextPage={loadNextPage}
        retry={reloadList}
      />
    );
  } else if (loadingChannels) {
    return <LoadingIndicator listType='channel' />;
  } else {
    return renderChannels();
  }
};

export default ChannelListMessenger;
