import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Dayjs from 'dayjs';

import { useIsOnline } from './hooks/useIsOnline';
import { useStreami18n } from './hooks/useStreami18n';

import { ChatProvider } from '../../contexts/chatContext/ChatContext';
import {
  DeepPartial,
  ThemeProvider,
} from '../../contexts/themeContext/ThemeContext';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';

import { version } from '../../../../package.json';

import type { Channel, StreamChat } from 'stream-chat';

import type { Theme } from '../../contexts/themeContext/utils/theme';
import type { Streami18n } from '../../utils/Streami18n';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

type ChatProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** The StreamChat client object */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
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
   * const i18n = new Streami18n('nl');
   * <Chat client={chatClient} i18nInstance={i18n}>
   *  ...
   * </Chat>
   * ```
   *
   * If you would like to override certain keys in in-built translation.
   * UI will be automatically updated in this case.
   *
   * ```
   * const i18n = new Streami18n('nl');
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
  i18nInstance?: Streami18n;
  logger?: (message?: string) => void;
  style?: DeepPartial<Theme>;
};

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - channel - currently active channel
 * - client - client connection
 * - connectionRecovering - whether or not websocket is reconnecting
 * - isOnline - whether or not set user is active
 * - logger - custom logging function
 * - setActiveChannel - function to set the currently active channel
 *
 * The Chat Component takes the following generics in order:
 * - At (AttachmentType) - custom Attachment object extension
 * - Ct (ChannelType) - custom Channel object extension
 * - Co (CommandType) - custom Command string union extension
 * - Ev (EventType) - custom Event object extension
 * - Me (MessageType) - custom Message object extension
 * - Re (ReactionType) - custom Reaction object extension
 * - Us (UserType) - custom User object extension
 *
 * @example ./Chat.md
 */
export const Chat = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<ChatProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { children, client, i18nInstance, logger = () => null, style } = props;

  const [channel, setChannel] = useState<Channel<At, Ch, Co, Ev, Me, Re, Us>>();
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });

  // Setup translators
  useStreami18n({ i18nInstance, setTranslators });

  // Setup connection event listeners
  const { connectionRecovering, isOnline } = useIsOnline<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >(client);

  useEffect(() => {
    client?.setUserAgent(`stream-chat-react-native-${Platform.OS}-${version}`);
  }, []);

  const setActiveChannel = (newChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>) =>
    setChannel(newChannel);

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
    <GestureHandlerRootView>
      <ChatProvider<At, Ch, Co, Ev, Me, Re, Us> value={chatContext}>
        <TranslationProvider value={translators}>
          <ThemeProvider style={style}>{children}</ThemeProvider>
        </TranslationProvider>
      </ChatProvider>
    </GestureHandlerRootView>
  );
};
