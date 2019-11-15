import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { NetInfo } from '../native';

import { themed } from '../styles/theme';

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ./docs/Chat.md
 * @extends PureComponent
 */

export const Chat = themed(
  class Chat extends PureComponent {
    static themePath = '';
    static propTypes = {
      /** The StreamChat client object */
      client: PropTypes.object.isRequired,
      /** Theme object */
      style: PropTypes.object,
      offlineSync: PropTypes.bool,
    };

    constructor(props) {
      super(props);
      this.state = {
        // currently active channel
        channel: {},
        isOnline: 'unknown',
        connectionRecovering: false,
        offlineSync: false,
      };

      this.unsubscribeNetInfo = null;

      this.setConnectionListener();

      this.props.client.on('connection.changed', (event) => {
        if (this._unmounted) return;
        this.setState({
          isOnline: event.online,
          connectionRecovering: !event.online,
        });
      });

      this.props.client.on('connection.established', () => {
        if (this._unmounted) return;
        this.setState({
          isOnline: true,
          connectionRecovering: false,
        });
      });

      this.props.client.on('connection.recovered', () => {
        if (this._unmounted) return;
        this.setState({ connectionRecovering: false });
      });

      this._unmounted = false;
    }

    componentWillUnmount() {
      this._unmounted = true;
      this.props.client.off('connection.recovered');
      this.props.client.off('connection.changed');
      this.props.client.off(this.handleEvent);
      this.unsubscribeNetInfo();
      this.props.storage && this.props.storage.clear();
    }

    notifyChatClient = (isConnected) => {
      if (this.props.client != null && this.props.client.wsConnection != null) {
        if (isConnected) {
          this.props.client.wsConnection.onlineStatusChanged({
            type: 'online',
          });
        } else {
          this.props.client.wsConnection.onlineStatusChanged({
            type: 'offline',
          });
        }
      }
    };

    setConnectionListener = () => {
      NetInfo.fetch().then((isConnected) => {
        this.setState({
          isOnline: isConnected,
          startedOffline: !isConnected,
        });
        this.notifyChatClient(isConnected);
      });
      this.unsubscribeNetInfo = NetInfo.addEventListener(
        async (isConnected) => {
          // TODO: Think more about startedOffline variable. Looks ugly!!
          if (isConnected && this.state.startedOffline) {
            // eslint-disable-next-line no-underscore-dangle
            await this.props.client._setupConnection();
          }
        },
      );
    };

    setActiveChannel = (channel, e) => {
      if (e !== undefined && e.preventDefault) {
        e.preventDefault();
      }
      if (this._unmounted) return;
      this.setState(() => ({
        channel,
      }));
    };

    getContext = () => ({
      client: this.props.client,
      channel: this.state.channel,
      setActiveChannel: this.setActiveChannel,
      isOnline: this.state.isOnline,
      connectionRecovering: this.state.connectionRecovering,
      storage: this.props.storage,
      offlineSync: this.props.offlineSync,
    });

    render() {
      return (
        <ChatContext.Provider value={this.getContext()}>
          {this.props.children}
        </ChatContext.Provider>
      );
    }
  },
);
