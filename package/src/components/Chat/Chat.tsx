import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';

import type { Channel, StreamChat } from 'stream-chat';

import { useAppSettings } from './hooks/useAppSettings';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useIsOnline } from './hooks/useIsOnline';
import { useMutedUsers } from './hooks/useMutedUsers';

import { useSyncDatabase } from './hooks/useSyncDatabase';

import { ChannelsStateProvider } from '../../contexts/channelsStateContext/ChannelsStateContext';
import { ChatContextValue, ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useDebugContext } from '../../contexts/debugContext/DebugContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { DeepPartial, ThemeProvider } from '../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../contexts/themeContext/utils/theme';
import {
  DEFAULT_USER_LANGUAGE,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';
import { useStreami18n } from '../../hooks/useStreami18n';
import init from '../../init';

import { SDK } from '../../native';
import { QuickSqliteClient } from '../../store/QuickSqliteClient';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { DBSyncManager } from '../../utils/DBSyncManager';
import type { Streami18n } from '../../utils/Streami18n';
import { version } from '../../version.json';

init();

export type ChatProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Partial<Pick<ChatContextValue<StreamChatGenerics>, 'ImageComponent'>> & {
    /**
     * When false, ws connection won't be disconnection upon backgrounding the app.
     * To receive push notifications, its necessary that user doesn't have active
     * websocket connection. So by default, we disconnect websocket connection when
     * app goes to background, and reconnect when app comes to foreground.
     */
    closeConnectionOnBackground?: boolean;
    /**
     * Enables offline storage and loading for chat data.
     */
    enableOfflineSupport?: boolean;
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
     * You can pass the theme object to customize the styles of Chat components. You can check the default theme in [theme.ts](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/themeContext/utils/theme.ts)
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics>>,
) => {
  const {
    children,
    client,
    closeConnectionOnBackground = true,
    enableOfflineSupport = false,
    i18nInstance,
    ImageComponent = Image,
    style,
  } = props;

  const [channel, setChannel] = useState<Channel<StreamChatGenerics>>();

  // Setup translators
  const translators = useStreami18n(i18nInstance);

  /**
   * Setup connection event listeners
   */
  const { connectionRecovering, isOnline } = useIsOnline<StreamChatGenerics>(
    client,
    closeConnectionOnBackground,
  );

  const [initialisedDatabase, setInitialisedDatabase] = useState(false);

  /**
   * Setup muted user listener
   * TODO: reimplement
   */
  const mutedUsers = useMutedUsers<StreamChatGenerics>(client);

  const debugRef = useDebugContext();
  const isDebugModeEnabled = __DEV__ && debugRef && debugRef.current;

  useEffect(() => {
    if (client) {
      client.setUserAgent(`${SDK}-${Platform.OS}-${version}`);
      // This is to disable recovery related logic in js client, since we handle it in this SDK
      client.recoverStateOnReconnect = false;
      client.persistUserOnConnectionFailure = enableOfflineSupport;
    }

    if (isDebugModeEnabled) {
      if (debugRef.current.setEventType) debugRef.current.setEventType('send');
      if (debugRef.current.setSendEventParams)
        debugRef.current.setSendEventParams({
          action: 'Client',
          data: client.user,
        });
    }
  }, [client, enableOfflineSupport]);

  const setActiveChannel = (newChannel?: Channel<StreamChatGenerics>) => setChannel(newChannel);

  useEffect(() => {
    if (client.user?.id && enableOfflineSupport) {
      setInitialisedDatabase(false);
      QuickSqliteClient.initializeDatabase();
      DBSyncManager.init(client as unknown as StreamChat);
      setInitialisedDatabase(true);
    }
  }, [client?.user?.id, enableOfflineSupport]);

  const appSettings = useAppSettings(client, isOnline, enableOfflineSupport, initialisedDatabase);

  const chatContext = useCreateChatContext({
    appSettings,
    channel,
    client,
    connectionRecovering,
    enableOfflineSupport,
    ImageComponent,
    isOnline,
    mutedUsers,
    setActiveChannel,
  });

  useSyncDatabase({
    client,
    enableOfflineSupport,
  });

  return (
    <ChatProvider<StreamChatGenerics> value={chatContext}>
      <TranslationProvider
        value={{ ...translators, userLanguage: client.user?.language || DEFAULT_USER_LANGUAGE }}
      >
        <ThemeProvider style={style}>
          <ChannelsStateProvider<StreamChatGenerics>>{children}</ChannelsStateProvider>
        </ThemeProvider>
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChatProps<StreamChatGenerics>>,
) => {
  const { style } = useOverlayContext();

  return <ChatWithContext {...{ style }} {...props} />;
};
