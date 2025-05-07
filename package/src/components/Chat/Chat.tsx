import React, { PropsWithChildren, useEffect, useState } from 'react';
import { Image, Platform } from 'react-native';

import type { Channel } from 'stream-chat';

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

import { NativeHandlers } from '../../native';
import { OfflineDB } from '../../store/OfflineDB';
import { SqliteClient } from '../../store/SqliteClient';

import type { Streami18n } from '../../utils/i18n/Streami18n';
import { version } from '../../version.json';

init();

export type ChatProps = Pick<ChatContextValue, 'client'> &
  Partial<Pick<ChatContextValue, 'ImageComponent' | 'isMessageAIGenerated'>> & {
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
     * Custom loading indicator component to be used to represent the loading state of the chat.
     *
     * This can be used during the phase when db is not initialised.
     */
    LoadingIndicator?: React.ComponentType | null;
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

const ChatWithContext = (props: PropsWithChildren<ChatProps>) => {
  const {
    children,
    client,
    closeConnectionOnBackground = true,
    enableOfflineSupport = false,
    i18nInstance,
    ImageComponent = Image,
    isMessageAIGenerated,
    LoadingIndicator = null,
    style,
  } = props;

  const [channel, setChannel] = useState<Channel>();

  // Setup translators
  const translators = useStreami18n(i18nInstance);

  /**
   * Setup connection event listeners
   */
  const { connectionRecovering, isOnline } = useIsOnline(client, closeConnectionOnBackground);

  const [initialisedDatabaseConfig, setInitialisedDatabaseConfig] = useState<{
    initialised: boolean;
    userID?: string;
  }>({
    initialised: false,
    userID: client.userID,
  });

  /**
   * Setup muted user listener
   * TODO: reimplement
   */
  const mutedUsers = useMutedUsers(client);

  const debugRef = useDebugContext();
  const isDebugModeEnabled = __DEV__ && debugRef && debugRef.current;

  const userID = client.userID;

  useEffect(() => {
    if (client) {
      const sdkName = (
        NativeHandlers.SDK ? NativeHandlers.SDK.replace('stream-chat-', '') : 'react-native'
      ) as 'react-native' | 'expo';
      client.sdkIdentifier = {
        name: sdkName,
        version,
      };
      client.deviceIdentifier = { os: `${Platform.OS} ${Platform.Version}` };
      // This is to disable recovery related logic in js client, since we handle it in this SDK
      client.recoverStateOnReconnect = false;
      client.persistUserOnConnectionFailure = enableOfflineSupport;
    }

    if (isDebugModeEnabled) {
      if (debugRef.current.setEventType) {
        debugRef.current.setEventType('send');
      }
      if (debugRef.current.setSendEventParams) {
        debugRef.current.setSendEventParams({
          action: 'Client',
          data: client.user,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, enableOfflineSupport]);

  const setActiveChannel = (newChannel?: Channel) => setChannel(newChannel);

  useEffect(() => {
    if (!(userID && enableOfflineSupport)) {
      return;
    }

    const initializeDatabase = () => {
      // TODO: Rethink this, it looks ugly
      if (!client.offlineDb) {
        client.setOfflineDBApi(new OfflineDB({ client }));
      }
      // This acts as a lock for some very rare occurrences of concurrency
      // issues we've encountered before with the QuickSqliteClient being
      // uninitialized before it's being invoked.
      setInitialisedDatabaseConfig({ initialised: false, userID });
      SqliteClient.initializeDatabase()
        .then(async () => {
          setInitialisedDatabaseConfig({ initialised: true, userID });
          if (client.offlineDb) {
            await client.offlineDb?.syncManager.init();
            // client.offlineDb.initialised = initialised;
          }
        })
        .catch((error) => {
          console.log('Error Initializing DB:', error);
        });
    };

    initializeDatabase();

    return () => {
      if (userID && enableOfflineSupport) {
        // SqliteClient.closeDB();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userID, enableOfflineSupport]);

  useEffect(() => {
    if (!client) {
      return;
    }

    client.threads.registerSubscriptions();
    client.polls.registerSubscriptions();

    return () => {
      client.threads.unregisterSubscriptions();
      client.polls.unregisterSubscriptions();
      // In case something went wrong, make sure to also unsubscribe the listener
      // on unmount if it exists to prevent a memory leak.
      // FIXME: Should be wrapped in its own unregistration mechanism
      client.offlineDb?.syncManager.connectionChangedListener?.unsubscribe();
    };
  }, [client]);

  const initialisedDatabase =
    initialisedDatabaseConfig.initialised && userID === initialisedDatabaseConfig.userID;

  const appSettings = useAppSettings(client, isOnline, enableOfflineSupport, initialisedDatabase);

  const chatContext = useCreateChatContext({
    appSettings,
    channel,
    client,
    connectionRecovering,
    enableOfflineSupport,
    ImageComponent,
    isMessageAIGenerated,
    isOnline,
    mutedUsers,
    setActiveChannel,
  });

  useSyncDatabase({
    client,
    enableOfflineSupport,
    initialisedDatabase,
  });

  if (userID && enableOfflineSupport && !initialisedDatabase) {
    // if user id has been set and offline support is enabled, we need to wait for database to be initialised
    return LoadingIndicator ? <LoadingIndicator /> : null;
  }

  return (
    <ChatProvider value={chatContext}>
      <TranslationProvider
        value={{ ...translators, userLanguage: client.user?.language || DEFAULT_USER_LANGUAGE }}
      >
        <ThemeProvider style={style}>
          <ChannelsStateProvider>{children}</ChannelsStateProvider>
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
 */
export const Chat = (props: PropsWithChildren<ChatProps>) => {
  const { style } = useOverlayContext();

  return <ChatWithContext {...{ style }} {...props} />;
};
