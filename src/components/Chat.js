import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext } from '../context';
import { NetInfo } from '../native';

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

const colors = ['light', 'dark'];
const baseUseCases = ['messaging', 'team', 'commerce', 'gaming', 'livestream'];
const themes = [];

for (const color of colors) {
  for (const useCase of baseUseCases) {
    themes.push(`${useCase} ${color}`);
  }
}

export class Chat extends PureComponent {
  static propTypes = {
    /** The StreamChat client object */
    client: PropTypes.object.isRequired,
    /** The theme 'messaging', 'team', 'commerce', 'gaming', 'livestream' plus either 'light' or 'dark' */
    theme: PropTypes.oneOf(themes),
  };

  static defaultProps = {
    theme: 'messaging light',
  };

  constructor(props) {
    super(props);

    this.state = {
      // currently active channel
      channel: {},
      // list of channels
      channels: [],
      // create new Channel state
      channelStart: false, // false
      isOnline: true,
    };

    NetInfo.getConnectionInfo().then((connectionInfo) => {
      console.log(
        'Initial, type: ' +
          connectionInfo.type +
          ', effectiveType: ' +
          connectionInfo.effectiveType,
      );
      this.setState({ isOnline: connectionInfo.type !== 'none' });
    });

    NetInfo.addEventListener('connectionChange', this.handleConnectionChange);
  }

  handleConnectionChange = (connectionInfo) => {
    console.log('CONNECTION CHANGED');

    this.setState({ isOnline: connectionInfo.type !== 'none' });
    // NetInfo.removeEventListener(
    //   'connectionChange',
    //   handleFirstConnectivityChange
    // );
  };

  setActiveChannel = (channel, e) => {
    if (e !== undefined && e.preventDefault) {
      e.preventDefault();
    }

    this.setState(() => ({
      channel,
    }));
  };

  getContext = () => ({
    client: this.props.client,
    channels: this.state.channels,
    channel: this.state.channel,
    setActiveChannel: this.setActiveChannel,
    theme: this.props.theme,
    isOnline: this.state.isOnline,
  });

  render() {
    return (
      <ChatContext.Provider value={this.getContext()}>
        {this.props.children}
      </ChatContext.Provider>
    );
  }
}
