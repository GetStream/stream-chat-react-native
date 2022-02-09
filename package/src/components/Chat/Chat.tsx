import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import Dayjs from 'dayjs';

import type { Channel } from 'stream-chat';

import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useIsOnline } from './hooks/useIsOnline';
import { useMutedUsers } from './hooks/useMutedUsers';

import { ChatContextValue, ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { DeepPartial, ThemeProvider } from '../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../contexts/themeContext/utils/theme';
import {
  TranslationContextValue,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';
import { useStreami18n } from '../../hooks/useStreami18n';

import { SDK } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { Streami18n } from '../../utils/Streami18n';
import { version } from '../../version.json';

export type ChatProps<
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatContextValue<StreamChatClient>, 'client'> & {
  /**
   * When false, ws connection won't be disconnection upon backgrounding the app.
   * To receive push notifications, its necessary that user doesn't have active
   * websocket connection. So by default, we disconnect websocket connection when
   * app goes to background, and reconnect when app comes to foreground.
   */
  closeConnectionOnBackground?: boolean;
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
  /**
   * You can pass the theme object to customize the styles of Chat components. You can check the default theme in [theme.ts](https://github.com/GetStream/stream-chat-react-native/blob/master/src/contexts/themeContext/utils/theme.ts)
   *
   * Please check section about [themes in cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#theme) for details.
   *
   * ```
   * import type { DeepPartial, Theme } from 'stream-chat-react-native';
   *
   * const theme: DeepPartial<Theme> = {
   *   messageSimple: {
   *     file: {
   *       container: {
   *         backgroundColor: 'red',
   *       },
   *       icon: {
   *         height: 16,
   *         width: 16,
   *       },
   *     },
   *   },
   * };
   *
   * <Chat style={theme}>
   * </Chat>
   * ```
   *
   * @overrideType object
   */
  style?: DeepPartial<Theme>;
};

const ChatWithContext = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChatProps<StreamChatClient>>,
) => {
  const { children, client, closeConnectionOnBackground = true, i18nInstance, style } = props;

  const [channel, setChannel] = useState<Channel<StreamChatClient>>();
  const [translators, setTranslators] = useState<TranslationContextValue>({
    t: (key: string) => key,
    tDateTimeParser: (input?: string | number | Date) => Dayjs(input),
  });

  /**
   * Setup translators
   */
  const loadingTranslators = useStreami18n({ i18nInstance, setTranslators });

  /**
   * Setup connection event listeners
   */
  const { connectionRecovering, isOnline } = useIsOnline<StreamChatClient>(
    client,
    closeConnectionOnBackground,
  );

  /**
   * Setup muted user listener
   */
  const mutedUsers = useMutedUsers<StreamChatClient>(client);

  useEffect(() => {
    if (client.setUserAgent) {
      client.setUserAgent(`${SDK}-${Platform.OS}-${version}`);
      // This is to disable recovery related logic in js client, since we handle it in this SDK
      client.recoverStateOnReconnect = false;
    }
  }, []);

  const setActiveChannel = (newChannel?: Channel<StreamChatClient>) => setChannel(newChannel);

  const chatContext = useCreateChatContext({
    channel,
    client,
    connectionRecovering,
    isOnline,
    mutedUsers,
    setActiveChannel,
  });

  if (loadingTranslators) return null;

  return (
    <ChatProvider<StreamChatClient> value={chatContext}>
      <TranslationProvider value={translators}>
        <ThemeProvider style={style}>{children}</ThemeProvider>
      </TranslationProvider>
    </ChatProvider>
  );
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
 */
export const Chat = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChatProps<StreamChatClient>>,
) => {
  const { style } = useOverlayContext();

  return <ChatWithContext {...{ style }} {...props} />;
};
