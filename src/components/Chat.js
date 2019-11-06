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
      logger: PropTypes.func,
    };

    static defaultProps = {
      logger: () => {},
    };

    constructor(props) {
      super(props);

      this.state = {
        // currently active channel
        channel: {},
        isOnline: true,
        connectionRecovering: false,
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

      this.props.client.on('connection.recovered', () => {
        if (this._unmounted) return;
        this.setState({ connectionRecovering: false });
      });

      this._unmounted = false;
    }

    componentDidMount() {
      this.props.logger('Chat component', 'componentDidMount', {
        tags: ['lifecycle', 'chat'],
        props: this.props,
        state: this.state,
      });
    }

    componentDidUpdate() {
      this.props.logger('Chat component', 'componentDidUpdate', {
        tags: ['lifecycle', 'chat'],
        props: this.props,
        state: this.state,
      });
    }

    componentWillUnmount() {
      this.props.logger('Chat component', 'componentWillUnmount', {
        tags: ['lifecycle', 'chat'],
        props: this.props,
        state: this.state,
      });

      this._unmounted = true;
      this.props.client.off('connection.recovered');
      this.props.client.off('connection.changed');
      this.props.client.off(this.handleEvent);
      this.unsubscribeNetInfo();
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
        this.notifyChatClient(isConnected);
      });
      this.unsubscribeNetInfo = NetInfo.addEventListener((isConnected) => {
        this.notifyChatClient(isConnected);
      });
    };

    setActiveChannel = (channel) => {
      this.props.logger('Chat component', 'setActiveChannel', {
        tags: ['chat'],
        props: this.props,
        state: this.state,
      });

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
      logger: this.props.logger,
    });

    render() {
      this.props.logger('Chat component', 'Rerendering', {
        props: this.props,
        state: this.state,
      });

      return (
        <ChatContext.Provider value={this.getContext()}>
          {this.props.children}
        </ChatContext.Provider>
      );
    }
  },
);
