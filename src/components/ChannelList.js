import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { withChatContext } from '../context';
import { ChannelListMessenger } from './ChannelListMessenger';
import Immutable from 'seamless-immutable';
import debounce from 'lodash/debounce';

import { LoadingIndicator } from './LoadingIndicator';
import { LoadingErrorIndicator } from './LoadingErrorIndicator';
import { EmptyStateIndicator } from './EmptyStateIndicator';
import uniqBy from 'lodash/uniqBy';
import uniqWith from 'lodash/uniqWith';
import isEqual from 'lodash/isEqual';

export const isPromise = (thing) => {
  const promise = thing && typeof thing.then === 'function';
  return promise;
};

export const DEFAULT_QUERY_CHANNELS_LIMIT = 10;
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open.
 * This components doesn't provide any UI for the list. UI is provided by component `List` which should be
 * provided to this component as prop. By default ChannelListMessenger is used a list UI.
 *
 * @extends PureComponent
 * @example ./docs/ChannelList.md
 */
const ChannelList = withChatContext(
  class ChannelList extends PureComponent {
    static propTypes = {
      /** The Preview to use, defaults to [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger) */
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

      List: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      onSelect: PropTypes.func,
      /**
       * Function that overrides default behaviour when new message is received on channel that is not being watched
       *
       * @param {Component} thisArg Reference to ChannelList component
       * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.message_new` event
       * */
      onMessageNew: PropTypes.func,
      /**
       * Function that overrides default behaviour when users gets added to a channel
       *
       * @param {Component} thisArg Reference to ChannelList component
       * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.added_to_channel` event
       * */
      onAddedToChannel: PropTypes.func,
      /**
       * Function that overrides default behaviour when users gets removed from a channel
       *
       * @param {Component} thisArg Reference to ChannelList component
       * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.removed_from_channel` event
       * */
      onRemovedFromChannel: PropTypes.func,
      /**
       * Function that overrides default behaviour when channel gets updated
       *
       * @param {Component} thisArg Reference to ChannelList component
       * @param {Event} event       [Event object](https://getstream.io/chat/docs/#event_object) corresponding to `notification.channel_updated` event
       * */
      onChannelUpdated: PropTypes.func,
      /**
       * Object containing query filters
       * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for filter.
       * */
      filters: PropTypes.object,
      /**
       * Object containing query options
       * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for options.
       * */
      options: PropTypes.object,
      /**
       * Object containing sort parameters
       * @see See [Channel query documentation](https://getstream.io/chat/docs/#query_channels) for a list of available fields for sort.
       * */
      sort: PropTypes.object,
      /** For flatlist  */
      loadMoreThreshold: PropTypes.number,
      /** Client object. Avaiable from [Chat context](#chatcontext) */
      client: PropTypes.object,
      /**
       * Function to set change active channel. This function acts as bridge between channel list and currently active channel component.
       *
       * @param channel A Channel object
       */
      setActiveChannel: PropTypes.func,
    };

    static defaultProps = {
      Preview: ChannelPreviewMessenger,
      List: ChannelListMessenger,
      LoadingIndicator,
      LoadingErrorIndicator,
      EmptyStateIndicator,
      filters: {},
      options: {},
      sort: {},
      // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
      loadMoreThreshold: 2,
      logger: () => {},
    };

    constructor(props) {
      super(props);
      this.state = {
        error: false,
        channels: Immutable([]),
        channelIds: Immutable([]),
        loadingChannels: true,
        hasNextPage: true,
        refreshing: false,
        offset: 0,
      };

      this.menuButton = React.createRef();

      this._queryChannelsDebounced = debounce(this.queryChannels, 1000, {
        leading: true,
        trailing: true,
      });
      this.offlineQueryActive = false;
      this.onlineQueryActive = false;

      this.hasNextOnlinePage = true;
      this.hasNextOfflinePage = true;
      this._unmounted = false;
    }

    async componentDidMount() {
      if (this.props.offlineSync) await this._queryOfflineChannels(true);
      await this._queryChannelsDebounced(true);
      this.listenToChanges();
      this.props.logger('ChannelList component', 'componentDidMount', {
        tags: ['lifecycle', 'channellist'],
        props: this.props,
        state: this.state,
      });
    }

    async componentDidUpdate(prevProps) {
      if (
        prevProps.isOnline === 'unknown' &&
        typeof this.props.isOnline === 'boolean' &&
        this.props.isOnline
      ) {
        this.props.client.activeChannels = {};
        await this._queryOnlineChannels(true);
      }
      if (
        prevProps.isOnline === 'unknown' &&
        typeof this.props.isOnline === 'boolean' &&
        !this.props.isOnline
      ) {
        await this._queryOfflineChannels();
      }

      await this._queryChannelsDebounced();
      this.listenToChanges();
      this.props.logger('ChannelList component', 'componentDidUpdate', {
        tags: ['lifecycle', 'channellist'],
        props: this.props,
        state: this.state,
      });
    }

    componentWillUnmount() {
      this.props.logger('ChannelList component', 'componentWillUnmount', {
        tags: ['lifecycle', 'channellist'],
        props: this.props,
        state: this.state,
      });

      this._unmounted = true;
      this.props.client.off(this.handleEvent);
      if (this.props.offlineSync)
        this.props.client.off(this.handleEventForOfflineSync);
      this._queryChannelsDebounced.cancel();
    }

    static getDerivedStateFromError(error) {
      return { error };
    }

    getPagerParams(resync) {
      const { options } = this.props;
      let offset;
      let limit;
      if (resync) {
        offset = 0;
        limit = this.state.channels.length;
        if (this._unmounted) return;
        this.setState({
          offset: 0,
        });
      } else {
        offset = this.state.offset;
        limit = options.limit;
      }

      return {
        limit,
        offset,
      };
    }

    // This can be moved to a hook once we stop the support for RN < 0.59
    async setChannelValues(channelValues, resync, pagerParams) {
      try {
        if (pagerParams.offset === 0 && channelValues.length >= 1) {
          if (this._unmounted) return;
          this.props.setActiveChannel(channelValues[0]);
        }

        if (this._unmounted) return;

        await this.setState((prevState) => {
          let channels;
          let channelIds;
          if (resync) {
            channels = [...channelValues];
            channelIds = [...channelValues.map((c) => c.id)];
          } else {
            // Remove duplicate channels in worse case we get repeted channel from backend.
            channelValues = channelValues.filter(
              (c) => this.state.channelIds.indexOf(c.id) === -1,
            );
            channels = [...prevState.channels, ...channelValues];
            channelIds = [
              ...prevState.channelIds,
              ...channelValues.map((c) => c.id),
            ];
          }
          return {
            channels, // not unique somehow needs more checking
            channelIds,
            loadingChannels: false,
            offset: channels.length,

            hasNextPage:
              channelValues.length >= (pagerParams.limit || 10) ? true : false,
            refreshing: false,
            offlineStateActive: true,
          };
        });
      } catch (e) {
        if (this._unmounted) return;
        this.setState({
          error: true,
          refreshing: false,
          loadingChannels: false,
        });
      }
    }

    queryChannels = async (resync = false, forceIsOnline = false) => {
      if (this.props.isOnline === 'unknown') return;

      if (this.props.isOnline || forceIsOnline) {
        await this._queryOnlineChannels(resync);
      } else if (this.props.offlineSync) {
        await this._queryOfflineChannels(resync);
      }
    };

    async _queryOfflineChannels(resync) {
      // If there is already active query.
      if (this.offlineQueryActive) return;

      this.offlineQueryActive = true;
      if (this._unmounted || !this.hasNextOfflinePage) {
        this.offlineQueryActive = false;
        return;
      }

      const { filters, sort } = this.props;

      const pagerParams = this.getPagerParams(resync);

      if (this._unmounted) return;
      this.setState({ refreshing: true });

      const query = {
        filters,
        sort,
      };
      const channelValues = await this.props.storage.queryChannels(
        JSON.stringify(query),
        pagerParams.offset,
        pagerParams.limit || 10,
      );

      await this.setChannelValues(channelValues, resync, pagerParams);
      this.hasNextOfflinePage =
        channelValues.length >= (pagerParams.limit || 10) ? true : false;
      this.offlineQueryActive = false;
    }

    async _queryOnlineChannels(resync) {
      if (this.onlineQueryActive) return;
      this.onlineQueryActive = true;
      if (this._unmounted || !this.hasNextOnlinePage) {
        this.onlineQueryActive = false;
        return;
      }

      const { options, filters, sort } = this.props;

      const pagerParams = this.getPagerParams(resync);

      if (this._unmounted) return;
      this.setState({ refreshing: true });

      this.props.logger('ChannelList component', 'queryChannels', {
        tags: ['channellist'],
        props: this.props,
        state: this.state,
        query: {
          filters,
          sort,
          ...options,
        },
      });
      const channelValues = await this.props.client.queryChannels(
        filters,
        sort,
        {
          ...options,
          ...pagerParams,
        },
      );
      await this.setChannelValues(channelValues, resync, pagerParams);

      const query = {
        filters,
        sort,
      };

      if (this.props.offlineSync) {
        await this.props.storage.storeChannels(
          JSON.stringify(query),
          channelValues,
          resync,
        );
      }
      this.hasNextOnlinePage =
        channelValues.length >= (pagerParams.limit || 10) ? true : false;
      this.onlineQueryActive = false;
    }

    listenToChanges() {
      this.props.client.on(this.handleEvent);
      if (this.props.offlineSync)
        this.props.client.on(this.handleEventForOfflineSync);
    }

    handleEventForOfflineSync = async (e) => {
      const channels = this.state.channels;
      const channelIndex = channels.findIndex(
        (channel) => channel.cid === e.cid,
      );

      if (e.type === 'message.new') {
        if (this.props.storage.insertMessageForChannel)
          await this.props.storage.insertMessageForChannel(
            channels[channelIndex].id,
            e.message,
          );
      }

      if (e.type === 'message.read') {
        await this.props.storage.updateReadState(
          channels[channelIndex].id,
          e.user,
          e.received_at,
        );
      }

      if (e.type === 'message.updated' || e.type === 'message.deleted') {
        if (this.props.storage.updateMessage)
          await this.props.storage.updateMessage(
            channels[channelIndex].id,
            e.message,
          );
      }

      if (e.type === 'member.added') {
        if (this.props.storage.addMemberToChannel)
          await this.props.storage.addMemberToChannel(
            channels[channelIndex].id,
            e.member,
          );
      }

      if (e.type === 'member.removed') {
        if (this.props.storage.removeMemberFromChannel)
          await this.props.storage.removeMemberFromChannel(
            channels[channelIndex].id,
            e.user.id,
          );
      }

      if (e.type === 'member.updated') {
        if (this.props.storage.updateMember)
          await this.props.storage.updateMember(e.member);
      }

      // // Channel data is updated
      if (e.type === 'channel.updated') {
        this.props.storage.updateChannelData(e.channel.id, e.channel);
      }

      if (e.type === 'reaction.new') {
        if (this.props.storage.addReactionForMessage)
          await this.props.storage.addReactionForMessage(
            channels[channelIndex].id,
            e.message,
            e.reaction,
            e.reaction.userId === this.props.client.userID,
          );
      }

      if (e.type === 'reaction.deleted') {
        if (this.props.storage.deleteReactionForMessage)
          await this.props.storage.deleteReactionForMessage(
            channels[channelIndex].id,
            e.message,
            e.reaction,
            e.reaction.userId === this.props.client.userID,
          );
      }

      return null;
    };

    handleEvent = async (e) => {
      if (e.type === 'user.presence.changed') {
        let newChannels = this.state.channels;

        newChannels = newChannels.map((channel) => {
          if (!channel.state.members[e.user.id]) return channel;

          channel.state.members.setIn([e.user.id, 'user'], e.user);

          return channel;
        });

        this.setState({ channels: [...newChannels] });
      }

      if (e.type === 'message.new') {
        this.moveChannelUp(e.cid);
      }

      // make sure to re-render the channel list after connection is recovered
      if (
        e.type === 'connection.recovered' ||
        e.type === 'connection.established'
      ) {
        this.queryChannels(true, true);
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
            channels: uniqBy([channel, ...prevState.channels], 'cid'),
            channelIds: uniqWith(
              [channel.id, ...prevState.channelIds],
              isEqual,
            ),
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
            channels: uniqBy([channel, ...prevState.channels], 'cid'),
            channelIds: uniqWith(
              [channel.id, ...prevState.channelIds],
              isEqual,
            ),
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
              channels,
              channelIds,
            };
          });
        }
      }

      // // Channel data is updated
      if (e.type === 'channel.updated') {
        const channels = this.state.channels;
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === e.channel.cid,
        );
        channels[channelIndex].data = Immutable(e.channel);
        this.setState({
          channels: [...channels],
        });

        if (
          this.props.onChannelUpdated &&
          typeof this.props.onChannelUpdated === 'function'
        )
          this.props.onChannelUpdated(this, e);
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
      this.setState({
        channels: [...channels],
      });
    };

    loadNextPage = () => {
      this._queryChannelsDebounced();
    };

    render() {
      const context = {
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
