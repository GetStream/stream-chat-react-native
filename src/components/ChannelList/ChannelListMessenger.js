import React, { useContext } from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';

import ChannelListFooterLoadingIndicator from './ChannelListFooterLoadingIndicator';
import ChannelListHeaderErrorIndicator from './ChannelListHeaderErrorIndicator';
import ChannelListHeaderNetworkDownIndicator from './ChannelListHeaderNetworkDownIndicator';

import ChannelPreview from '../ChannelPreview/ChannelPreview';
import ChannelPreviewMessenger from '../ChannelPreview/ChannelPreviewMessenger';
import EmptyStateIndicatorDefault from '../Indicators/EmptyStateIndicator';
import LoadingErrorIndicatorDefault from '../Indicators/LoadingErrorIndicator';
import LoadingIndicatorDefault from '../Indicators/LoadingIndicator';

import { ChatContext } from '../../context';

/**
 * This UI component displays the preview list of channels and handles Channel navigation.
 *
 * @example ../docs/ChannelListMessenger.md
 */
const ChannelListMessenger = (props) => {
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

  const { isOnline } = useContext(ChatContext);

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

  if (loadingChannels) {
    return renderLoading();
  } else if (error && !refreshing && !(channels && channels.length)) {
    return renderLoadingError();
  } else {
    return renderChannels();
  }
};

/* eslint-disable */
ChannelListMessenger.propTypes = {
  /**
   * Channels can be either an array of channels or a promise which resolves to an array of channels
   */
  channels: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.objectOf({
      then: PropTypes.func,
    }),
  ]).isRequired,
  /**
   * Besides the existing default behavior of the ChannelListMessenger component, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **Example:**
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
  additionalFlatListProps: PropTypes.object,
  /**
   * Error in channels query, if any
   * */
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels: PropTypes.bool,
  /**
   * Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
   * */
  loadingNextPage: PropTypes.bool,
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold: PropTypes.number,
  /**
   * Loads the next page of `channels`, which is present as a required prop
   * */
  loadNextPage: PropTypes.func,
  /**
   * Triggered when the channel list is refreshing, displays a loading spinner at the top of the list
   * */
  refreshing: PropTypes.bool,
  /**
   * Function to refresh the channel list that is similar to `reloadList`, but it doesn't wipe out existing channels
   * from UI before loading the new ones
   */
  refreshList: PropTypes.func,
  /**
   * Removes all the existing channels from UI and loads fresh channels
   * */
  reloadList: PropTypes.func,
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   * */
  setActiveChannel: PropTypes.func,
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
  setFlatListRef: PropTypes.func,
  /**
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   * */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   * */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading indicator to use
   *
   * Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   * */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger)
   * */
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};
/* eslint-enable */

export default ChannelListMessenger;
