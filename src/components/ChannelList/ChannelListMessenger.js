import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { ChannelPreview, ChannelPreviewMessenger } from '../ChannelPreview';

import { withChatContext } from '../../context';

import ChannelListHeaderNetworkDownIndicator from './ChannelListHeaderNetworkDownIndicator';
import ChannelListHeaderErrorIndicator from './ChannelListHeaderErrorIndicator';
import ChannelListFooterLoadingIndicator from './ChannelListFooterLoadingIndicator';

import {
  EmptyStateIndicator,
  LoadingErrorIndicator,
  LoadingIndicator,
} from '../Indicators';

/**
 * ChannelListMessenger - UI component for list of channels, allowing you to select the channel you want to open
 *
 * @example ../docs/ChannelListMessenger.md
 */
class ChannelListMessenger extends PureComponent {
  static propTypes = {
    /**
     * Besides existing (default) UX behaviour of underlying flatlist of ChannelListMessenger component, if you want
     * to attach some additional props to un derlying flatlist, you can add it to following prop.
     *
     * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
     *
     * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
     *
     * e.g.
     * ```
     * <ChannelListMessenger
     *  channels={channels}
     *  additionalFlatListProps={{ bounces: true }} />
     * ```
     */
    additionalFlatListProps: PropTypes.object,
    /** Channels can be either an array of channels or a promise which resolves to an array of channels */
    channels: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.objectOf({
        then: PropTypes.func,
      }),
      PropTypes.object,
    ]).isRequired,
    /** The indicator to use when channel list is empty. Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator) */
    EmptyStateIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /** If there is error in querying channels */
    error: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    /**
     * Loading indicator to display at bottom of the list, while loading further pages.
     * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
     */
    FooterLoadingIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /**
     * The indicator to display error at top of list, if there was an error loading some page/channels after the first page.
     * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
     */
    HeaderErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /**
     * The indicator to display network-down error at top of list, if there is connectivity issue
     * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
     */
    HeaderNetworkDownIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /** If channels are being queries. LoadingIndicator will be displayed if true */
    loadingChannels: PropTypes.bool,
    /** The indicator to use when there is error in fetching channels. Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator) */
    LoadingErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /** The loading indicator to use. Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator) */
    LoadingIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),
    /** If further channels are being loadded. Loader will be shown at bottom of the list */
    loadingNextPage: PropTypes.bool,
    /**
     * For flatlist
     * @see See loeadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
     * */
    loadMoreThreshold: PropTypes.number,
    /** Loads next page of channels in channels object, which is present here as prop */
    loadNextPage: PropTypes.func,
    /** UI Component to display individual channel item in list.
     * Defaults to [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger) */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
    /** If channel list is being refreshed. Loader at top of the list will be displayed if true. */
    refreshing: PropTypes.bool,
    /**
     * Refresh the channel list. Its similar to `reloadList`, but it doesn't wipe out existing channels
     * from UI before loading new set of channels.
     */
    refreshList: PropTypes.func,
    /** Remove all the existing channels from UI and load fresh channels. */
    reloadList: PropTypes.func,
    setActiveChannel: PropTypes.func,
    /**
     * Use `setFlatListRef` to get access to ref to inner FlatList.
     *
     * e.g.
     * ```
     * <ChannelListMessenger
     *  setFlatListRef={(ref) => {
     *    // Use ref for your own good
     *  }}
     * ```
     */
    setFlatListRef: PropTypes.func,
  };

  static defaultProps = {
    additionalFlatListProps: {},
    EmptyStateIndicator,
    FooterLoadingIndicator: ChannelListFooterLoadingIndicator,
    HeaderErrorIndicator: ChannelListHeaderErrorIndicator,
    HeaderNetworkDownIndicator: ChannelListHeaderNetworkDownIndicator,
    LoadingErrorIndicator,
    LoadingIndicator,
    // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
    loadMoreThreshold: 2,
    Preview: ChannelPreviewMessenger,
  };

  renderLoading = () => {
    const Indicator = this.props.LoadingIndicator;
    return <Indicator listType='channel' />;
  };

  renderLoadingError = () => {
    const Indicator = this.props.LoadingErrorIndicator;
    return (
      <Indicator
        error={this.props.error}
        listType='channel'
        loadNextPage={this.props.loadNextPage}
        retry={this.props.reloadList}
      />
    );
  };

  renderEmptyState = () => {
    const Indicator = this.props.EmptyStateIndicator;
    return <Indicator listType='channel' />;
  };

  renderHeaderIndicator = () => {
    const { error, isOnline, refreshList } = this.props;

    if (!isOnline) {
      const HeaderNetworkDownIndicator = this.props.HeaderNetworkDownIndicator;
      return <HeaderNetworkDownIndicator />;
    }

    if (error) {
      const HeaderErrorIndicator = this.props.HeaderErrorIndicator;
      return <HeaderErrorIndicator onPress={refreshList} />;
    }
  };

  renderChannels = () => (
    <>
      {this.renderHeaderIndicator()}
      <FlatList
        data={this.props.channels}
        keyExtractor={(item) => item.cid}
        ListEmptyComponent={this.renderEmptyState}
        ListFooterComponent={() => {
          if (this.props.loadingNextPage) {
            const FooterLoadingIndicator = this.props.FooterLoadingIndicator;

            return <FooterLoadingIndicator />;
          }

          return null;
        }}
        onEndReached={() => this.props.loadNextPage(false)}
        onEndReachedThreshold={this.props.loadMoreThreshold}
        onRefresh={() => this.props.refreshList()}
        ref={(flRef) => {
          this.props.setFlatListRef && this.props.setFlatListRef(flRef);
        }}
        refreshing={this.props.refreshing}
        renderItem={({ item: channel }) => (
          <ChannelPreview
            {...this.props}
            channel={channel}
            key={channel.cid}
            Preview={this.props.Preview}
          />
        )}
        {...this.props.additionalFlatListProps}
      />
    </>
  );

  render() {
    if (this.props.error && this.props.channels.length === 0) {
      return this.renderLoadingError();
    } else if (this.props.loadingChannels) {
      return this.renderLoading();
    } else {
      return this.renderChannels();
    }
  }
}

export default withChatContext(ChannelListMessenger);
