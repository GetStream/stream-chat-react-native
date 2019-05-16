import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { NetInfo } from '../native';

import { ThemeProvider } from 'styled-components';
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
    };

    this.setConnectionListener();
    this._unmounted = false;
  }

  componentWillUnmount() {
    this._unmounted = true;
    this.props.client.off(this.handleEvent);
    NetInfo.removeEventListener(
      'connectionChange',
      this.handleConnectionChange,
    );
  }

  setConnectionListener = () => {
    NetInfo.isConnected.fetch().then((isConnected) => {
      this.setState({ isOnline: isConnected });
    });

    NetInfo.addEventListener('connectionChange', this.handleConnectionChange);
  };

  handleConnectionChange = () => {
    NetInfo.isConnected.fetch().then((isConnected) => {
      this.setState({ isOnline: isConnected });
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
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        <ThemeProvider theme={buildTheme(this.props.theme)}>
          {this.props.children}
        </ThemeProvider>
      </ChatContext.Provider>
    );
  }
}
