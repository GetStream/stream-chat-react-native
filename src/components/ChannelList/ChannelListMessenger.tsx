import React from 'react';
import { FlatList, FlatListProps } from 'react-native';
import type { Channel, LiteralStringForUnion, UnknownType } from 'stream-chat';

import ChannelListFooterLoadingIndicator from './ChannelListFooterLoadingIndicator';
import ChannelListHeaderErrorIndicator, {
  HeaderErrorProps,
} from './ChannelListHeaderErrorIndicator';
import ChannelListHeaderNetworkDownIndicator from './ChannelListHeaderNetworkDownIndicator';
import ChannelPreview from '../ChannelPreview/ChannelPreview';
import ChannelPreviewMessenger from '../ChannelPreview/ChannelPreviewMessenger';
import EmptyStateIndicatorDefault, {
  EmptyStateProps,
} from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault, {
  LoadingErrorProps,
} from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault, {
  LoadingProps,
} from '../Indicators/LoadingIndicator';

import { useChatContext } from '../../contexts/chatContext/ChatContext';

export type ListMessengerProps<
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
> = {
  /**
   * Channels can be either an array of channels or a promise which resolves to an array of channels
   */
  channels: Channel<At, Ch, Co, Ev, Me, Re, Us>[];
  /**
   * Besides the existing default behavior of the ChannelListMessenger component, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **EXAMPLE:**
   *
   * ```
   * <ChannelListMessenger
   *  channels={channels}
   *  additionalFlatListProps={{ bounces: true }}
   * />
   * ```
   *
   * **Note:** Don't use `additionalFlatListProps` to access the FlatList ref, use `setFlatListRef`
   */
  additionalFlatListProps?: FlatListProps<Channel<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   * */
  EmptyStateIndicator?: React.ComponentType<Partial<EmptyStateProps>>;
  /**
   * Error in channels query, if any
   * */
  error?: boolean;
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator?: React.ComponentType;
  /**
   * Incremental number change to force update the FlatList
   */
  forceUpdate?: number;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage?: boolean;
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator?: React.ComponentType<Partial<HeaderErrorProps>>;
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator?: React.ComponentType;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels?: boolean;
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   * */
  LoadingErrorIndicator?: React.ComponentType<Partial<LoadingErrorProps>>;
  /**
   * Custom loading indicator to use
   *
   * Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   * */
  LoadingIndicator?: React.ComponentType<Partial<LoadingProps>>;
  /**
   * Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
   * */
  loadingNextPage?: boolean;
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold?: number;
  /**
   * Loads the next page of `channels`, which is present as a required prop
   * */
  loadNextPage?: () => Promise<void> | null;
  /**
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger)
   * */
  Preview?: React.ComponentType; // TODO: add Partial<ChannelPreviewProps>
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
  At extends UnknownType = UnknownType,
  Ch extends UnknownType = UnknownType,
  Co extends string = LiteralStringForUnion,
  Ev extends UnknownType = UnknownType,
  Me extends UnknownType = UnknownType,
  Re extends UnknownType = UnknownType,
  Us extends UnknownType = UnknownType
>(
  props: ListMessengerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalFlatListProps = {},
    channels,
    error,
    forceUpdate,
    loadingChannels,
    loadingNextPage,
    // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
    loadMoreThreshold = 2,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setActiveChannel,
    setFlatListRef,
  } = props;

  const { isOnline } = useChatContext();

  const renderLoading = () => {
    const { LoadingIndicator = LoadingIndicatorDefault } = props;
    return <LoadingIndicator listType='channel' />;
  };

  const renderLoadingError = () => {
    const { LoadingErrorIndicator = LoadingErrorIndicatorDefault } = props;
    return (
      <LoadingErrorIndicator
        error={error}
        listType='channel'
        loadNextPage={loadNextPage}
        retry={reloadList}
      />
    );
  };

  const renderEmptyState = () => {
    const { EmptyStateIndicator = EmptyStateIndicatorDefault } = props;
    return <EmptyStateIndicator listType='channel' />;
  };

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

  const renderChannels = () => {
    const {
      FooterLoadingIndicator = ChannelListFooterLoadingIndicator,
      Preview = ChannelPreviewMessenger,
    } = props;
    return (
      <>
        {renderHeaderIndicator()}
        <FlatList
          data={channels}
          extraData={forceUpdate}
          keyExtractor={(item) => item.cid}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={() => {
            if (loadingNextPage) {
              return <FooterLoadingIndicator />;
            }
            return null;
          }}
          onEndReached={loadNextPage}
          onEndReachedThreshold={loadMoreThreshold}
          onRefresh={refreshList}
          ref={(flRef) => {
            setFlatListRef && setFlatListRef(flRef);
          }}
          refreshing={refreshing}
          renderItem={({ item: channel }) => (
            <ChannelPreview
              {...props}
              channel={channel}
              key={channel.cid}
              Preview={Preview}
              setActiveChannel={setActiveChannel}
            />
          )}
          testID='channel-list-messenger'
          {...additionalFlatListProps}
        />
      </>
    );
  };

  if (error && !refreshing && !(channels && channels.length)) {
    return renderLoadingError();
  } else if (loadingChannels) {
    return renderLoading();
  } else {
    return renderChannels();
  }
};

export default ChannelListMessenger;
