import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatContext, TranslationContext } from '../context';
import { NetInfo } from '../native';

import { themed } from '../styles/theme';
import { Streami18n } from '../utils/Streami18n';
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
      /**
       * Theme object
       *
       * @ref https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
       * */
      style: PropTypes.object,
      logger: PropTypes.func,
      /**
       * Instance of Streami18n class should be provided to Chat component to enable internationalization.
       *
       * Stream provides following list of in-built translations:
       * 1. English (en)
       * 2. Dutch (nl)
       * 3. ...
       * 4. ...
       *
       * Simplest way to start using chat components in one of the in-built languages would be following:
       *
       * ```
       * const i18n = new Streami18n('nl);
       * <Chat client={chatClient} i18nInstance={i18n}>
       *  ...
       * </Chat>
       * ```
       *
       * If you would like to override certain keys in in-built translation.
       * UI will be automatically updated in this case.
       *
       * ```
       * const i18n = new Streami18n('nl);
       *
       * i18n.registerTranslation('nl', {
       *  'Nothing yet...': 'Nog Niet ...',
       *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
       * });
       *
       * <Chat client={chatClient} i18nInstance={i18n}>
       *  ...
       * </Chat>
       * ```
       *
       * You can use the same function to add whole new language.
       *
       * ```
       * const i18n = new Streami18n('it');
       *
       * i18n.registerTranslation('it', {
       *  'Nothing yet...': 'Non ancora ...',
       *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} a {{ secondUser }} stanno scrivendo...',
       * });
       *
       * // Make sure to call setLanguage to reflect new language in UI.
       * i18n.setLanguage('it');
       * <Chat client={chatClient} i18nInstance={i18n}>
       *  ...
       * </Chat>
       * ```
       */
      i18nInstance: PropTypes.instanceOf(Streami18n),
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
        t: null,
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

    async componentDidMount() {
      this.props.logger('Chat component', 'componentDidMount', {
        tags: ['lifecycle', 'chat'],
        props: this.props,
        state: this.state,
      });

      const { i18nInstance } = this.props;

      let streami18n;
      if (i18nInstance && i18nInstance instanceof Streami18n) {
        streami18n = i18nInstance;
      } else {
        streami18n = new Streami18n({ language: 'en' });
      }

      streami18n.registerSetLanguageCallback((t) => {
        this.setState({ t });
      });

      const { t, tDateTimeParser } = await streami18n.getTranslators();
      this.setState({ t, tDateTimeParser });
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
      this.unsubscribeNetInfo && this.unsubscribeNetInfo();
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

      if (!this.state.t) return null;

      return (
        <ChatContext.Provider value={this.getContext()}>
          <TranslationContext.Provider
            value={{
              t: this.state.t,
              tDateTimeParser: this.state.tDateTimeParser,
            }}
          >
            {this.props.children}
          </TranslationContext.Provider>
        </ChatContext.Provider>
      );
    }
  },
);
