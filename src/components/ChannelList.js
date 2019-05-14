import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { LoadingIndicator } from './LoadingIndicator';
import { withChatContext } from '../context';
import { ChannelListMessenger } from './ChannelListMessenger';
import Immutable from 'seamless-immutable';
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */
export const isPromise = (thing) => {
  const promise = thing && typeof thing.then === 'function';
  return promise;
};

const ChannelList = withChatContext(
  class ChannelList extends PureComponent {
    static propTypes = {
      /** The Preview to use, defaults to ChannelPreviewMessenger */
      Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

      /** The loading indicator to use */
      LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      onSelect: PropTypes.func,

      /** Function that overrides default behaviour when users gets added to a channel */
      onAddedToChannel: PropTypes.func,
      /** Function that overrides default behaviour when users gets removed from a channel */
      onRemovedFromChannel: PropTypes.func,

      /** Object containing query filters */
      filters: PropTypes.object,
      /** Object containing query options */
      options: PropTypes.object,
      /** Object containing sort parameters */
      sort: PropTypes.object,
    };

    static defaultProps = {
      Preview: ChannelPreviewMessenger,
      LoadingIndicator,
      List: ChannelListMessenger,
      hasNextPage: true,
      filters: {},
      options: {},
      sort: {},
    };

    constructor(props) {
      super(props);
      this.state = {
        error: false,
        loading: true,
        channels: Immutable([]),
        loadingChannels: true,
        refreshing: false,
        offset: 0,
      };

      this.menuButton = React.createRef();
    }

    isPromise = (thing) => {
      const promise = thing && typeof thing.then === 'function';
      return promise;
    };

    async componentDidMount() {
      await this.queryChannels();
      this.listenToChanges();
    }

    componentWillUnmount() {
      this._unmounted = true;
      this.props.client.off(this.handleEvent);
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

    queryChannels = async () => {
      if (this._unmounted) return;
      const { options, filters, sort } = this.props;
      const { offset } = this.state;

      this.setState({ refreshing: true });
      const channelPromise = this.props.client.queryChannels(filters, sort, {
        ...options,
        offset,
      });

      try {
        let channelQueryResponse = channelPromise;
        if (isPromise(channelQueryResponse)) {
          channelQueryResponse = await channelPromise;
          if (offset === 0 && channelQueryResponse.length >= 1) {
            if (this._unmounted) return;
            this.props.setActiveChannel(channelQueryResponse[0]);
          }
        }
        if (this._unmounted) return;
        this.setState((prevState) => {
          const channels = [...prevState.channels, ...channelQueryResponse];
          return {
            channels, // not unique somehow needs more checking
            loadingChannels: false,
            offset: channels.length,
            hasNextPage:
              channelQueryResponse.length >= options.limit ? true : false,
            refreshing: false,
          };
        });
      } catch (e) {
        console.warn(e);
        if (this._unmounted) return;
        this.setState({ error: true, refreshing: false });
      }
    };

    listenToChanges() {
      this.props.client.on(this.handleEvent);
    }

    handleEvent = async (e) => {
      if (e.type === 'message.new') {
        this.moveChannelUp(e.cid);
      }

      // move channel to start
      if (e.type === 'notification.message_new') {
        // if new message, put move channel up
        // get channel if not in state currently
        const channel = await this.getChannel(e.cid);
        // move channel to starting position
        this.setState((prevState) => ({
          channels: [...channel, ...prevState.channels],
        }));
      }

      // add to channel
      if (e.type === 'notification.added_to_channel') {
        if (
          this.props.onAddedToChannel &&
          typeof this.props.onAddedToChannel === 'function'
        ) {
          this.props.onAddedToChannel(e);
        } else {
          const channel = await this.getChannel(e.channel.cid);
          this.setState((prevState) => ({
            channels: [...channel, ...prevState.channels],
          }));
        }
      }

      // remove from channel
      if (e.type === 'notification.removed_from_channel') {
        if (
          this.props.onRemovedFromChannel &&
          typeof this.props.onRemovedFromChannel === 'function'
        ) {
          this.props.onRemovedFromChannel(e);
        } else {
          this.setState((prevState) => {
            const channels = prevState.channels.filter(
              (channel) => channel.cid !== e.channel.cid,
            );
            return {
              channels,
            };
          });
        }
      }

      return null;
    };

    getChannel = async (cid) => {
      const channelPromise = this.props.client.queryChannels({ cid });

      try {
        let channelQueryResponse = channelPromise;
        if (isPromise(channelQueryResponse)) {
          channelQueryResponse = await channelPromise;
        }
        return channelQueryResponse;
      } catch (e) {
        console.warn(e);
      }
    };

    moveChannelUp = (cid) => {
      if (this._unmounted) return;
      const channels = this.state.channels;

      // get channel index
      const channelIndex = this.state.channels.findIndex(
        (channel) => channel.cid === cid,
      );
      if (channelIndex === 0) return;

      // get channel from channels
      const channel = channels[channelIndex];

      //remove channel from current position
      channels.splice(channelIndex, 1);
      //add channel at the start
      channels.unshift(channel);

      // set new channel state
      this.setState({
        channels: [...channels],
      });
    };

    loadNextPage = () => {
      this.queryChannels();
    };

    render() {
      const context = {
        clickCreateChannel: this.clickCreateChannel,
        closeMenu: this.closeMenu,
        loadNextPage: this.loadNextPage,
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
