import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { NetInfo } from '../native';

import { ThemeProvider } from '@stream-io/styled-components';
import { buildTheme } from '../styles/theme';

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

export class Chat extends PureComponent {
  static propTypes = {
    /** The StreamChat client object */
    client: PropTypes.object.isRequired,
    /** The theme 'messaging', 'team', 'commerce', 'gaming', 'livestream' plus either 'light' or 'dark' */
    theme: PropTypes.object,
  };

  static defaultProps = {
    theme: {},
  };

  constructor(props) {
    super(props);

    this.state = {
      // currently active channel
      channel: {},
      isOnline: true,
      connectionRecovering: false,
    };

    this.setConnectionListener();

    this.props.client.on('connection.changed', (event) => {
      this.setState({
        isOnline: event.online,
        connectionRecovering: !event.online,
      });
    });

    this.props.client.on('connection.recovered', () => {
      this.setState({ connectionRecovering: false });
    });

    this._unmounted = false;
  }

  componentWillUnmount() {
    this._unmounted = true;
    this.props.client.off('connection.recovered');
    this.props.client.off('connection.changed');
    this.props.client.off(this.handleEvent);
    NetInfo.removeEventListener(
      'connectionChange',
      this.handleConnectionChange,
    );
  }

  notifyChatClient = (isConnected) => {
    if (this.wsConnection != null) {
      if (isConnected) {
        this.wsConnection.onlineStatusChanged({ type: 'online' });
      } else {
        this.wsConnection.onlineStatusChanged({ type: 'offline' });
      }
    }
  };

  setConnectionListener = () => {
    NetInfo.isConnected.fetch().then((isConnected) => {
      this.notifyChatClient(isConnected);
    });

    NetInfo.addEventListener('connectionChange', this.handleConnectionChange);
  };

  handleConnectionChange = () => {
    NetInfo.isConnected.fetch().then((isConnected) => {
      this.notifyChatClient(isConnected);
    });
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
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        <ThemeProvider theme={buildTheme(this.theme)}>
          {this.props.children}
        </ThemeProvider>
      </ChatContext.Provider>
    );
  }
}
