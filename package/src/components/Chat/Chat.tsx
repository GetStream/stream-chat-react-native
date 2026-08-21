import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { Channel, OfflineDBState } from 'stream-chat';

import { useClientMutedUsers } from './hooks';
import { useAppSettings } from './hooks/useAppSettings';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useInitializeOfflineDb } from './hooks/useInitializeOfflineDb';
import { useIsOnline } from './hooks/useIsOnline';

import { ChatContextValue, ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { useDebugContext } from '../../contexts/debugContext/DebugContext';
import { DeepPartial, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../contexts/themeContext/utils/theme';
import {
  DEFAULT_USER_LANGUAGE,
  TranslationProvider,
} from '../../contexts/translationContext/TranslationContext';
import { useStateStore } from '../../hooks';
import { useStreami18n } from '../../hooks/useStreami18n';
import init from '../../init';

import { NativeHandlers } from '../../native';
import { DEFAULT_MAX_SYNC_EVENTS_LIMIT } from '../../store/constants';

import type { Streami18n } from '../../utils/i18n/Streami18n';
import { installNativeMultipartAdapter } from '../../utils/installNativeMultipartAdapter';
import { version } from '../../version.json';

init();

export type ChatProps = Pick<ChatContextValue, 'client'> &
  Partial<Pick<ChatContextValue, 'isMessageAIGenerated'>> & {
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
     * Encrypts the offline database at rest with SQLCipher, using the key this
     * resolves to. Only relevant when `enableOfflineSupport` is enabled. Leaving it
     * unset keeps the offline database unencrypted, which is the default.
     *
     * Requires a native build of `@op-engineering/op-sqlite` that includes SQLCipher.
     * Add the following to your application's `package.json` and rebuild the native
     * app - without the flag the key is accepted and then silently ignored:
     *
     * ```json
     * { "op-sqlite": { "sqlcipher": true } }
     * ```
     *
     * **Wrap `<Chat>` in an error boundary.** If the database cannot be opened with
     * the encryption you asked for, `<Chat>` throws a {@link SqliteClientError}
     * from render instead of continuing without it. The SDK deliberately takes no
     * recovery action of its own - it never deletes data, and never silently falls
     * back to an unencrypted or absent cache. Discriminate on `code`:
     *
     * - `OFFLINE_DB_UNREADABLE` - the file exists but this key cannot read it (the
     *   key changed, or the database predates encryption). **Recommended recovery:
     *   `SqliteClient.deleteDatabase()`, then re-mount `<Chat>`.** The contents are a
     *   cache and are refetched from the server; the exception is actions queued while
     *   offline, which are lost - prompt the user first if that matters to you.
     * - `ENCRYPTION_KEY_UNAVAILABLE` - the key could not be read (a locked keychain, a
     *   launch before first unlock). The database is untouched. **Recommended
     *   recovery: re-mount to retry** once the key is readable - for example when the
     *   app next returns to the foreground.
     * - `SQLCIPHER_BUILD_MISSING` - the native build has no SQLCipher, so the key
     *   would be ignored and the database written in plaintext. Not recoverable at
     *   runtime; it needs the build flag above and a new binary. **Recommended
     *   recovery: re-mount with `enableOfflineSupport={false}`** so nothing is
     *   persisted unencrypted.
     *
     * The key must be **stable for the lifetime of the database file**. There is no
     * rekey path, so a key that changes costs one `OFFLINE_DB_UNREADABLE` and a
     * rebuild. To rotate without paying that, rotate a key-encryption key and keep the
     * database key it protects unchanged (envelope encryption).
     *
     * Switching encryption on, or back off, leaves a database from the other mode on
     * disk and so raises `OFFLINE_DB_UNREADABLE` once in each direction. Deleting it
     * from your boundary is all that is needed.
     */
    getOfflineDbEncryptionKey?: () => Promise<string | undefined>;
    /**
     * Optional positive cap on the number of events a single `/sync` response may
     * contain before the offline sync manager skips replaying those events into
     * local storage.
     *
     * On reconnect the SDK downloads the events missed while offline and writes
     * them to the offline DB. For a very large payload this replay is both costly
     * on-device and unnecessary for what the user is looking at — the active
     * channel list and any open channel are refreshed independently on reconnect
     * (via `queryChannels` + `channel.watch()`). When the payload exceeds this
     * limit the replay is skipped and that reconnect refresh covers the visible
     * channels; inactive channels are hydrated on their next explicit query. The
     * last-sync timestamp is still advanced so the same payload is not retried.
     *
     * Defaults to {@link DEFAULT_MAX_SYNC_EVENTS_LIMIT} (250). Pass `false` to
     * disable the limit entirely (replay every event — the historical behavior).
     *
     * Only relevant when `enableOfflineSupport` is enabled.
     *
     * @default 250
     */
    maxSyncEventsLimit?: number | false;
    /**
     * When true, multipart uploads use the SDK's native upload adapter when available.
     * When false, uploads stay on the default axios adapter.
     *
     * This only controls whether the native adapter gets installed by this Chat instance.
     * It does not uninstall an adapter that was already installed on the client.
     *
     * @default false
     */
    useNativeMultipartUpload?: boolean;
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
     *   messageItemView: {
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

const selector = (nextValue: OfflineDBState) =>
  ({
    initialized: nextValue.initialized,
    userId: nextValue.userId,
  }) as const;

const ChatWithContext = (props: PropsWithChildren<ChatProps>) => {
  const {
    children,
    client,
    closeConnectionOnBackground = true,
    enableOfflineSupport = false,
    getOfflineDbEncryptionKey,
    i18nInstance,
    isMessageAIGenerated,
    maxSyncEventsLimit = DEFAULT_MAX_SYNC_EVENTS_LIMIT,
    style,
    useNativeMultipartUpload = false,
  } = props;
  const { ChatLoadingIndicator } = useComponentsContext();

  const [channel, setChannel] = useState<Channel>();

  // Setup translators
  const translators = useStreami18n(i18nInstance);

  /**
   * Tracked rather than read inline: `client.user` is a plain field, so a `useMemo` over it only
   * re-evaluates when something else re-renders `Chat`. A language changed server-side would
   * otherwise never reach the components that read it.
   */
  const [userLanguage, setUserLanguage] = useState(
    () => client.user?.language || DEFAULT_USER_LANGUAGE,
  );
  useEffect(() => {
    const sync = () => setUserLanguage(client.user?.language || DEFAULT_USER_LANGUAGE);

    sync();
    const { unsubscribe } = client.on('user.updated', (event) => {
      if (event.user?.id === client.user?.id) sync();
    });
    return unsubscribe;
  }, [client]);

  const translationContextValue = useMemo(
    () => ({ ...translators, userLanguage }),
    [translators, userLanguage],
  );

  /**
   * Setup connection event listeners
   */
  const { connectionRecovering, isOnline } = useIsOnline(client, closeConnectionOnBackground);

  const { initialized: offlineDbInitialized, userId: offlineDbUserId } =
    useStateStore(client.offlineDb?.state, selector) ?? {};

  /**
   * Setup muted user listener
   * TODO: reimplement
   */
  const mutedUsers = useClientMutedUsers(client);

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
      client.preventThreadCleanup = true;
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

  useInitializeOfflineDb({
    client,
    enabled: enableOfflineSupport,
    options: { getEncryptionKey: getOfflineDbEncryptionKey, maxSyncEventsLimit },
    userID,
  });

  useEffect(() => {
    if (!client) {
      return;
    }

    client.threads.registerSubscriptions();
    client.polls.registerSubscriptions();
    client.reminders.registerSubscriptions();
    client.reminders.initTimers();

    return () => {
      client.threads.unregisterSubscriptions();
      client.polls.unregisterSubscriptions();
      client.reminders.unregisterSubscriptions();
      client.reminders.clearTimers();
    };
  }, [client]);

  useEffect(() => {
    if (!useNativeMultipartUpload) {
      return;
    }

    installNativeMultipartAdapter(client);
  }, [client, useNativeMultipartUpload]);

  const initialisedDatabase = !!offlineDbInitialized && userID === offlineDbUserId;

  const appSettings = useAppSettings(client, isOnline, enableOfflineSupport, initialisedDatabase);

  const chatContext = useCreateChatContext({
    appSettings,
    channel,
    client,
    connectionRecovering,
    enableOfflineSupport,
    isMessageAIGenerated,
    isOnline,
    mutedUsers,
    setActiveChannel,
  });

  if (userID && enableOfflineSupport && !initialisedDatabase) {
    // if user id has been set and offline support is enabled, we need to wait for database to be initialised
    return ChatLoadingIndicator ? <ChatLoadingIndicator /> : null;
  }

  return (
    <ChatProvider value={chatContext}>
      <TranslationProvider value={translationContextValue}>
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
 */
export const Chat = (props: PropsWithChildren<ChatProps>) => {
  const { theme } = useTheme();

  return <ChatWithContext style={theme as DeepPartial<Theme>} {...props} />;
};
