import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { ChannelPreview } from './ChannelPreview';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { withChatContext } from '../context';

import { LoadingIndicator } from './LoadingIndicator';
import { LoadingErrorIndicator } from './LoadingErrorIndicator';
import { EmptyStateIndicator } from './EmptyStateIndicator';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ./examples/ChannelList.md
 */
const ChannelListMessenger = withChatContext(
  class ChannelListMessenger extends PureComponent {
    static propTypes = {
      /** Channels can be either an array of channels or a promise which resolves to an array of channels */
      channels: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.objectOf({
          then: PropTypes.func,
        }),
        PropTypes.object,
      ]).isRequired,
      /** The Preview to use, defaults to ChannelPreviewMessenger */
      Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

      /** The loading indicator to use */
      LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /** The indicator to use when there is error in fetching channels */
      LoadingErrorIndicator: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.func,
      ]),
      /** The indicator to use when channel list is empty */
      EmptyStateIndicator: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.func,
      ]),

      loadNextPage: PropTypes.func,
      loadMoreThreshold: PropTypes.number,
    };

    static defaultProps = {
      Preview: ChannelPreviewMessenger,
      LoadingIndicator,
      LoadingErrorIndicator,
      EmptyStateIndicator,
      // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
      loadMoreThreshold: 2,
    };

    renderLoading = () => {
      const Indicator = this.props.LoadingIndicator;
      return <Indicator listType="channel" />;
    };

    renderLoadingError = () => {
      const Indicator = this.props.LoadingErrorIndicator;
      return <Indicator listType="channel" />;
    };

    renderEmptyState = () => {
      const Indicator = this.props.EmptyStateIndicator;
      return <Indicator listType="channel" />;
    };

    renderChannels = () => (
      <FlatList
        data={this.props.channels}
        onEndReached={this.props.loadNextPage}
        onEndReachedThreshold={this.props.loadMoreThreshold}
        ListEmptyComponent={this.renderEmptyState}
        renderItem={({ item: channel }) => (
          <ChannelPreview
            {...this.props}
            key={channel.cid}
            channel={channel}
            Preview={this.props.Preview}
          />
        )}
        keyExtractor={(item) => item.cid}
      />
    );

    render() {
      if (this.props.error) {
        return this.renderLoadingError();
      } else if (this.props.loadingChannels) {
        return this.renderLoading();
      } else {
        return this.renderChannels();
      }
    }
  },
);

export { ChannelListMessenger };
