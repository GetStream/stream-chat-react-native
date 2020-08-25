import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import debounce from 'lodash/debounce';

import {
  EmptyStateIndicator,
  LoadingErrorIndicator,
  LoadingIndicator,
} from '../Indicators';

import { ChannelPreviewMessenger } from '../ChannelPreview';
import ChannelListMessenger from './ChannelListMessenger';

import { withChatContext } from '../../context';

import uniqBy from 'lodash/uniqBy';
import uniqWith from 'lodash/uniqWith';
import isEqual from 'lodash/isEqual';

export const isPromise = (thing) => {
  const promise = thing && typeof thing.then === 'function';
  return promise;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
export const MAX_QUERY_CHANNELS_LIMIT = 30;

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open.
 * This components doesn't provide any UI for the list. UI is provided by component `List` which should be
 * provided to this component as prop. By default ChannelListMessenger is used a list UI.
 *
 * @extends PureComponent
 * @example ../docs/ChannelList.md
 */
class ChannelList extends PureComponent {
  static propTypes = {
    /**
     * Besides existing (default) UX behaviour of underlying flatlist of ChannelList component, if you want
     * to attach some additional props to un derlying flatlist, you can add it to following prop.
     *
     * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
     *
     * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
     *
     * e.g.
     * ```
     * <ChannelList
     *  filters={filters}
     *  sort={sort}
     *  additionalFlatListProps={{ bounces: true }} />
     * ```
     */
    additionalFlatListProps: PropTypes.object,

    /** Client object. Avaiable from [Chat context](#chatcontext) */
    client: PropTypes.object,

    /** The indicator to use when channel list is empty */
    EmptyStateIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),

    /**
     * Object containing query filters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for filter.
     * */
    filters: PropTypes.object,

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

    List: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),

    /** The indicator to use when there is error in fetching channels */
    LoadingErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),

    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.elementType,
    ]),

    /** For flatlist  */
    loadMoreThreshold: PropTypes.number,

    /**
     * If true, channels won't be dynamically sorted by most recent message.
     */
    lockChannelOrder: PropTypes.bool,

    /**
     * Function that overrides default behaviour when users gets added to a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
     * */
    onAddedToChannel: PropTypes.func,

    /**
     * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.deleted` event
     * */
    onChannelDeleted: PropTypes.func,

    /**
     * Function that overrides default behaviour when channel gets hidden. In absence of this prop, channel will be removed from the list.
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.hidden` event
     * */
    onChannelHidden: PropTypes.func,

    /**
     * Function to customize behaviour when channel gets truncated
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.truncated` event
     * */
    onChannelTruncated: PropTypes.func,

    /**
     * Function that overrides default behaviour when channel gets updated
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.updated` event
     * */
    onChannelUpdated: PropTypes.func,

    /**
     * Function that overrides default behaviour when new message is received on channel that is not being watched
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
     * */
    onMessageNew: PropTypes.func,

    /**
     * Function that overrides default behaviour when users gets removed from a channel
     *
     * @param {Component} thisArg Reference to ChannelList component
     * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.removed_from_channel` event
     * */
    onRemovedFromChannel: PropTypes.func,

    onSelect: PropTypes.func,

    /**
     * Object containing query options
     * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for options.
     * */
    options: PropTypes.object,

    /** The Preview to use, defaults to [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger) */
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),

    /**
     * Function to set change active channel. This function acts as bridge between channel list and currently active channel component.
     *
     * @param channel A Channel object
     */
    setActiveChannel: PropTypes.func,

    /**
     * Use `setFlatListRef` to get access to ref to inner FlatList.
     *
     * e.g.
     * ```
     * <ChannelList
     *  setFlatListRef={(ref) => {
     *    // Use ref for your own good
     *  }}
     * ```
     */
    setFlatListRef: PropTypes.func,

    /**
     * Object containing sort parameters
     * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for sort.
     * */
    sort: PropTypes.object,
  };

  static defaultProps = {
    additionalFlatListProps: {},
    EmptyStateIndicator,
    filters: {},
    List: ChannelListMessenger,
    LoadingErrorIndicator,
    LoadingIndicator,
    // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
    loadMoreThreshold: 2,
    lockChannelOrder: false,
    logger: () => {},
    options: {},
    Preview: ChannelPreviewMessenger,
    sort: {},
  };

  constructor(props) {
    super(props);
    this.state = {
      channelIds: Immutable([]),
      channels: Immutable([]),
      error: false,
      hasNextPage: true,
      loadingChannels: true,
      loadingNextPage: false,
      offset: 0,
      refreshing: false,
    };
    this.listRef = React.createRef();
    this.lastRefresh = new Date();
    this._queryChannelsDebounced = debounce(
      async (params = {}) => {
        await this.queryChannelsPromise;
        if (this.state.error) {
          return;
        }

        if (!this.state.hasNextPage) {
          return;
        }

        this.queryChannels(params.queryType);
      },
      1000,
      {
        leading: true,
        trailing: true,
      },
    );
    this._unmounted = false;
  }

  async componentDidMount() {
    await this.queryChannels('reload');
    this.listenToChanges();
  }

  async componentDidUpdate(prevProps) {
    // do we need deepequal?
    if (
      !isEqual(prevProps.filters, this.props.filters) ||
      !isEqual(prevProps.sort, this.props.sort)
    ) {
      this._queryChannelsDebounced.cancel();
      await this.queryChannels('reload');
    }
  }

  componentWillUnmount() {
    this._unmounted = true;
    this.props.client.off(this.handleEvent);
    this._queryChannelsDebounced.cancel();
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.warn(error, error.isUnmounted, info);
  }

  setStateAsync = (newState) => {
    if (this._unmounted) {
      this._queryChannelsDebounced.cancel();
      return;
    }

    return new Promise((resolve) => {
      this.setState(newState, resolve);
    });
  };

  wait = (ms) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms);
    });

  queryChannelsRequest = async (filters, sort, options, retryCount = 1) => {
    let channelQueryResponse;
    try {
      channelQueryResponse = await this.props.client.queryChannels(
        filters,
        sort,
        options,
      );
    } catch (e) {
      // Wait for 2 seconds before making another attempt
      await this.wait(2000);
      // Don't try more than 3 times.
      if (retryCount === 3) {
        throw e;
      }
      return this.queryChannelsRequest(filters, sort, options, retryCount + 1);
    }

    return channelQueryResponse;
  };

  getQueryParams = (queryType) => {
    const { filters, options, sort } = this.props;
    let offset;
    let limit;

    if (queryType === 'refresh' || queryType === 'reload') {
      offset = 0;
      limit = MAX_QUERY_CHANNELS_LIMIT;
      if (this.state.channels.length === 0) {
        limit = options.limit || DEFAULT_QUERY_CHANNELS_LIMIT;
      } else if (this.state.channels.length < MAX_QUERY_CHANNELS_LIMIT) {
        limit = Math.max(
          this.state.channels.length,
          DEFAULT_QUERY_CHANNELS_LIMIT,
        );
      }
    } else {
      limit = options.limit || DEFAULT_QUERY_CHANNELS_LIMIT;
      offset = this.state.offset;
    }

    const queryOptions = {
      ...options,
      limit,
      offset,
    };

    return {
      filters,
      options: queryOptions,
      sort,
    };
  };

  setRefreshingUIState = () =>
    this.setStateAsync({
      loadingChannels: false,
      loadingNextPage: false,
      refreshing: true,
    });

  setReloadingUIState = () =>
    this.setStateAsync({
      channelIds: Immutable([]),
      channels: Immutable([]),
      error: false,
      loadingChannels: true,
      loadingNextPage: false,
      refreshing: false,
    });

  setLoadingNextPageUIState = () =>
    this.setStateAsync({
      loadingChannels: false,
      loadingNextPage: true,
      refreshing: false,
    });

  // Sets the loading UI state before the star
  startQueryLoadingUIState = async (queryType) => {
    switch (queryType) {
      case 'refresh':
        await this.setRefreshingUIState();
        break;
      case 'reload':
        await this.setReloadingUIState();
        break;
      default:
        await this.setLoadingNextPageUIState();
        break;
    }
  };

  finishQueryLoadingUIState = () =>
    this.setStateAsync({
      loadingChannels: false,
      loadingNextPage: false,
      refreshing: false,
    });

  /**
   * queryType - 'refresh' | 'reload'
   *
   * refresh - Refresh the channel list. You will see the existing channels during refreshing.a
   *  Mainly used for pull to refresh or resyning upong network recovery.
   *
   * reload  - Reload the channel list from begining. You won't see existing channels during reload.
   */
  queryChannels = (queryType) => {
    // Don't query again if query is already active or there are no more results.
    // eslint-disable-next-line no-async-promise-executor
    this.queryChannelsPromise = new Promise(async (resolve) => {
      try {
        await this.startQueryLoadingUIState(queryType);

        const { filters, options, sort } = this.getQueryParams(queryType);
        const channelQueryResponse = await this.queryChannelsRequest(
          filters,
          sort,
          options,
        );

        // Set the active channel only in case of reload.
        if (queryType === 'reload' && channelQueryResponse.length >= 1) {
          this.props.setActiveChannel(channelQueryResponse[0]);
        }

        this.finishQueryLoadingUIState();
        const hasNextPage =
          channelQueryResponse.length >=
          (options.limit || DEFAULT_QUERY_CHANNELS_LIMIT);

        if (queryType === 'refresh' || queryType === 'reload') {
          await this.setChannels(channelQueryResponse, {
            error: false,
            hasNextPage,
          });
        } else {
          await this.appendChannels(channelQueryResponse, {
            error: false,
            hasNextPage,
          });
        }

        resolve(true);
      } catch (e) {
        await this.handleError(e);

        resolve(false);
        return;
      }
    });

    return this.queryChannelsPromise;
  };

  handleError = () => {
    this._queryChannelsDebounced.cancel();
    this.finishQueryLoadingUIState();
    return this.setStateAsync({
      error: true,
    });
  };

  appendChannels = (channels = [], additionalState = {}) => {
    // Remove duplicate channels in worse case we get repeted channel from backend.
    let distinctChannels = channels.filter(
      (c) => this.state.channelIds.indexOf(c.id) === -1,
    );

    distinctChannels = [...this.state.channels, ...distinctChannels];
    const channelIds = [
      ...this.state.channelIds,
      ...distinctChannels.map((c) => c.id),
    ];

    return this.setStateAsync({
      channelIds,
      channels: distinctChannels,
      offset: distinctChannels.length,
      ...additionalState,
    });
  };

  setChannels = (channels = [], additionalState = {}) => {
    const distinctChannels = [...channels];
    const channelIds = [...channels.map((c) => c.id)];

    return this.setStateAsync({
      channelIds,
      channels: distinctChannels,
      offset: distinctChannels.length,
      ...additionalState,
    });
  };

  listenToChanges() {
    this.props.client.on(this.handleEvent);
  }

  handleEvent = async (e) => {
    if (e.type === 'channel.hidden') {
      if (
        this.props.onChannelHidden &&
        typeof this.props.onChannelHidden === 'function'
      ) {
        this.props.onChannelHidden(this, e);
      } else {
        const channels = this.state.channels;
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === e.cid,
        );

        if (channelIndex < 0) return;

        // Remove the hidden channel from the list.
        channels.splice(channelIndex, 1);
        this.setStateAsync({
          channels: [...channels],
        });
      }
    }

    if (e.type === 'user.presence.changed' || e.type === 'user.updated') {
      let newChannels = this.state.channels;

      newChannels = newChannels.map((channel) => {
        if (!channel.state.members[e.user.id]) return channel;

        channel.state.members.setIn([e.user.id, 'user'], e.user);

        return channel;
      });

      this.setStateAsync({ channels: [...newChannels] });
    }

    if (e.type === 'message.new') {
      !this.props.lockChannelOrder && this.moveChannelUp(e.cid);
    }

    // make sure to re-render the channel list after connection is recovered
    if (e.type === 'connection.recovered') {
      this._queryChannelsDebounced.cancel();
      this.queryChannels('refresh');
    }

    // move channel to start
    if (e.type === 'notification.message_new') {
      if (
        this.props.onMessageNew &&
        typeof this.props.onMessageNew === 'function'
      ) {
        this.props.onMessageNew(this, e);
      } else {
        const channel = await this.getChannel(e.channel.type, e.channel.id);

        // move channel to starting position
        if (this._unmounted) return;
        this.setState((prevState) => ({
          channelIds: uniqWith([channel.id, ...prevState.channelIds], isEqual),
          channels: uniqBy([channel, ...prevState.channels], 'cid'),
          offset: prevState.offset + 1,
        }));
      }
    }

    // add to channel
    if (e.type === 'notification.added_to_channel') {
      if (
        this.props.onAddedToChannel &&
        typeof this.props.onAddedToChannel === 'function'
      ) {
        this.props.onAddedToChannel(this, e);
      } else {
        const channel = await this.getChannel(e.channel.type, e.channel.id);

        if (this._unmounted) return;
        this.setState((prevState) => ({
          channelIds: uniqWith([channel.id, ...prevState.channelIds], isEqual),
          channels: uniqBy([channel, ...prevState.channels], 'cid'),
          offset: prevState.offset + 1,
        }));
      }
    }

    // remove from channel
    if (e.type === 'notification.removed_from_channel') {
      if (
        this.props.onRemovedFromChannel &&
        typeof this.props.onRemovedFromChannel === 'function'
      ) {
        this.props.onRemovedFromChannel(this, e);
      } else {
        if (this._unmounted) return;
        this.setState((prevState) => {
          const channels = prevState.channels.filter(
            (channel) => channel.cid !== e.channel.cid,
          );
          const channelIds = prevState.channelIds.filter(
            (cid) => cid !== e.channel.cid,
          );
          return {
            channelIds,
            channels,
          };
        });
      }
    }

    // Channel data is updated
    if (e.type === 'channel.updated') {
      const channels = this.state.channels;
      const channelIndex = channels.findIndex(
        (channel) => channel.cid === e.channel.cid,
      );

      if (channelIndex > -1) {
        channels[channelIndex].data = Immutable(e.channel);
        this.setStateAsync({
          channels: [...channels],
        });
      }

      if (
        this.props.onChannelUpdated &&
        typeof this.props.onChannelUpdated === 'function'
      )
        this.props.onChannelUpdated(this, e);
    }

    // Channel is deleted
    if (e.type === 'channel.deleted') {
      if (
        this.props.onChannelDeleted &&
        typeof this.props.onChannelDeleted === 'function'
      ) {
        this.props.onChannelDeleted(this, e);
      } else {
        const channels = this.state.channels;
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === e.channel.cid,
        );

        if (channelIndex < 0) return;

        // Remove the deleted channel from the list.
        channels.splice(channelIndex, 1);
        this.setStateAsync({
          channels: [...channels],
        });
      }
    }

    if (e.type === 'channel.truncated') {
      this.setState((prevState) => ({
        channels: [...prevState.channels],
      }));

      if (
        this.props.onChannelTruncated &&
        typeof this.props.onChannelTruncated === 'function'
      )
        this.props.onChannelTruncated(this, e);
    }

    return null;
  };

  getChannel = async (type, id) => {
    const channel = this.props.client.channel(type, id);
    await channel.watch();
    return channel;
  };

  moveChannelUp = (cid) => {
    if (this._unmounted) return;
    const channels = this.state.channels;

    // get channel index
    const channelIndex = this.state.channels.findIndex(
      (channel) => channel.cid === cid,
    );
    if (channelIndex <= 0) return;

    // get channel from channels
    const channel = channels[channelIndex];

    //remove channel from current position
    channels.splice(channelIndex, 1);
    //add channel at the start
    channels.unshift(channel);

    // set new channel state
    if (this._unmounted) return;
    this.setStateAsync({
      channels: [...channels],
    });
  };

  // Refreshes the list. Existing list of channels will still be visible on UI while refreshing.
  refreshList = async () => {
    const now = new Date();
    // Only allow pull-to-refresh 10 seconds after last successful refresh.
    if (now - this.lastRefresh < 10000 && !this.state.error) {
      return;
    }

    // if (!this.state.error) return;
    this.listRef.scrollToIndex({ index: 0 });
    this._queryChannelsDebounced.cancel();
    const success = await this.queryChannels('refresh');

    if (success) this.lastRefresh = new Date();
  };

  // Reloads the channel list. All the existing channels will be wiped out first from UI, and then
  // queryChannels api will be called to fetch new channels.
  reloadList = () => {
    this._queryChannelsDebounced.cancel();
    this.queryChannels('reload');
  };

  loadNextPage = () => {
    this._queryChannelsDebounced();
  };

  render() {
    const context = {
      loadNextPage: this.loadNextPage,
      refreshList: this.refreshList,
      reloadList: this.reloadList,
    };
    const List = this.props.List;
    const props = { ...this.props, setActiveChannel: this.props.onSelect };

    return (
      <React.Fragment>
        <List
          {...props}
          {...this.state}
          {...context}
          setFlatListRef={(ref) => {
            this.listRef = ref;
            this.props.setFlatListRef && this.props.setFlatListRef(ref);
          }}
        />
      </React.Fragment>
    );
  }
}

export default withChatContext(ChannelList);
