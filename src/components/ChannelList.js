import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { LoadingIndicator } from './LoadingIndicator';
import { withChatContext } from '../context';
import { ChannelListMessenger } from './ChannelListMessenger';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */

const ChannelList = withChatContext(
  class ChannelList extends PureComponent {
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
      List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      onSelect: PropTypes.func,
    };

    static defaultProps = {
      Preview: ChannelPreviewMessenger,
      LoadingIndicator,
      List: ChannelListMessenger,
    };

    constructor(props) {
      super(props);
      this.state = { error: false, loading: true, channels: [] };

      this.menuButton = React.createRef();
    }

    isPromise = (thing) => {
      const promise = thing && typeof thing.then === 'function';
      return promise;
    };

    async componentDidMount() {
      try {
        let channelQueryResponse = this.props.channels;
        if (this.isPromise(channelQueryResponse)) {
          channelQueryResponse = await this.props.channels;
          if (channelQueryResponse.length >= 1) {
            this.props.setActiveChannel(channelQueryResponse[0]);
          }
        }
        this.setState({ loading: false, channels: channelQueryResponse });
      } catch (e) {
        console.log(e);
        this.setState({ error: true });
      }
    }

    static getDerivedStateFromError() {
      return { error: true };
    }

    componentDidCatch(error, info) {
      console.warn(error, info);
    }

    clickCreateChannel = (e) => {
      this.props.setChannelStart();
      e.target.blur();
    };

    closeMenu = () => {
      this.menuButton.current.checked = false;
    };

    render() {
      const context = {
        clickCreateChannel: this.clickCreateChannel,
        closeMenu: this.closeMenu,
      };
      const List = this.props.List;
      const props = { ...this.props, setActiveChannel: this.props.onSelect };

      return (
        <React.Fragment>
          <List {...props} {...this.state} {...context} />
        </React.Fragment>
      );
    }
  },
);

export { ChannelList };
