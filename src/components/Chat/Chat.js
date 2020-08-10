import React, { useEffect, useState } from 'react';
import Dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { ChatContext, TranslationContext } from '../../context';
import { useConnectionChanged } from './hooks/useConnectionChanged';
import { useConnectionListener } from './hooks/useConnectionListener';
import { useConnectionRecovered } from './hooks/useConnectionRecovered';
import { useStreami18n } from './hooks/useStreami18n';
import { themed } from '../../styles/theme';
import { Streami18n } from '../../utils/Streami18n';

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - channel (the currently active channel)
 * - client (the client connection)
 * - connectionRecovering (whether or not websocket is reconnecting)
 * - isOnline (whether or not set user is active)
 * - logger (custom logging function)
 * - setActiveChannel (function to set the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ../docs/Chat.md
 */
const Chat = (props) => {
  const { children, client, i18nInstance, logger = () => {} } = props;

  const [channel, setChannel] = useState(undefined);
  const [connectionRecovering, setConnectionRecovering] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [translators, setTranslators] = useState({
    t: (key) => key,
    tDateTimeParser: (input) => Dayjs(input),
  });
  const [unmounted, setUnmounted] = useState(false);

  // Setup translators
  useStreami18n({ i18nInstance, setTranslators });

  // Setup connection listener
  useConnectionListener({ client });

  // Setup event listeners
  useConnectionChanged({
    client,
    setConnectionRecovering,
    setIsOnline,
    unmounted,
  });
  useConnectionRecovered({ client, setConnectionRecovering, unmounted });

  useEffect(() => {
    if (client) {
      logger('Chat component', 'mount', {
        props,
        state: { channel, connectionRecovering, isOnline, translators },
        tags: ['lifecycle', 'chat'],
      });
    }

    return () => {
      logger('Chat component', 'unmount', {
        props,
        state: { channel, connectionRecovering, isOnline, translators },
        tags: ['lifecycle', 'chat'],
      });
      setUnmounted(true);
    };
  }, [client]);

  const setActiveChannel = (channel) => {
    logger('Chat component', 'setActiveChannel', {
      props,
      state: { channel, connectionRecovering, isOnline, translators },
      tags: ['chat'],
    });

    if (unmounted) return;
    setChannel(channel);
  };

  if (!translators.t) return null;

  const chatContext = {
    channel,
    client,
    connectionRecovering,
    isOnline,
    logger,
    setActiveChannel,
  };

  return (
    <ChatContext.Provider value={chatContext}>
      <TranslationContext.Provider value={translators}>
        {children}
      </TranslationContext.Provider>
    </ChatContext.Provider>
  );
};

Chat.propTypes = {
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

Chat.themePath = '';

export default themed(Chat);
