import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import type { OfflineDBState } from 'stream-chat';

import { useAppSettingsGetter } from './hooks/useAppSettingsGetter';
import { useClientUserId } from './hooks/useClientUserId';
import { useConnectionLifecycle } from './hooks/useConnectionLifecycle';
import { useCreateChatContext } from './hooks/useCreateChatContext';
import { useInitializeOfflineDb } from './hooks/useInitializeOfflineDb';
import { usePendingUploadsDefault } from './hooks/usePendingUploadsDefault';

import { ChatContextValue, ChatProvider } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { ThemeProvider, ThemeStyle, useTheme } from '../../contexts/themeContext/ThemeContext';
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
     * Whether to close the WebSocket connection while the app is in the background and reopen it in
     * the foreground. Push notifications are only delivered while no connection is active. Defaults
     * to true.
     */
    closeConnectionOnBackground?: boolean;
    /** Enables offline storage and loading for chat data. Defaults to false. */
    enableOfflineSupport?: boolean;
    /**
     * Resolves the key that encrypts the offline database at rest with SQLCipher. Only applies with
     * `enableOfflineSupport`; when unset the database is unencrypted.
     *
     * Needs a native `@op-engineering/op-sqlite` build with SQLCipher
     * (`{ "op-sqlite": { "sqlcipher": true } }` in the app's `package.json`).
     *
     * When the database cannot be opened with the requested encryption, `<Chat>` throws a
     * {@link SqliteClientError} from render, so wrap it in an error boundary. The SDK never deletes
     * data or falls back to an unencrypted cache. Branch on `code`:
     * - `OFFLINE_DB_UNREADABLE`: the existing file cannot be read with this key. Call
     *   `SqliteClient.deleteDatabase()` and re-mount; actions queued while offline are lost.
     * - `ENCRYPTION_KEY_UNAVAILABLE`: the key could not be read (such as a locked keychain). The
     *   database is untouched; re-mount to retry.
     * - `SQLCIPHER_BUILD_MISSING`: the native build lacks SQLCipher. Re-mount with
     *   `enableOfflineSupport={false}` so nothing is persisted unencrypted.
     *
     * The key must stay the same for the life of the database file, as there is no rekey. Switching
     * encryption on or off raises `OFFLINE_DB_UNREADABLE` once, until the old database is deleted.
     */
    getOfflineDbEncryptionKey?: () => Promise<string | undefined>;
    /**
     * Positive cap on how many events of a single `/sync` response the offline sync manager replays
     * into local storage on reconnect. Above the cap the replay is skipped, the reconnect refresh
     * covers the visible channels, and the last-sync timestamp still advances. `false` disables the
     * cap. Only applies with `enableOfflineSupport`.
     *
     * @default 250
     */
    maxSyncEventsLimit?: number | false;
    /**
     * Installs the SDK's native multipart upload adapter on the client when true and available;
     * otherwise uploads use the default axios adapter. An adapter already installed stays in place.
     *
     * @default false
     */
    useNativeMultipartUpload?: boolean;
    /**
     * The `Streami18n` instance that enables internationalization.
     *
     * The SDK ships English only. Add a language by registering a dictionary keyed by the SDK's
     * dotted translation keys, then switching to it:
     *
     * ```
     * const i18n = new Streami18n();
     *
     * i18n.registerTranslation('it', {
     *  'channelPreview.noMessages.text': 'Ancora nessun messaggio',
     * });
     * i18n.setLanguage('it');
     *
     * <Chat client={chatClient} i18nInstance={i18n}>
     *  ...
     * </Chat>
     * ```
     */
    i18nInstance?: Streami18n;
    /**
     * Theme overrides, merged over the default theme in
     * [theme.ts](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/themeContext/utils/theme.ts).
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
    style?: ThemeStyle;
  };

const isNeverAIGenerated = () => false;

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
    isMessageAIGenerated = isNeverAIGenerated,
    maxSyncEventsLimit = DEFAULT_MAX_SYNC_EVENTS_LIMIT,
    style,
    useNativeMultipartUpload = false,
  } = props;
  const { ChatLoadingIndicator } = useComponentsContext();

  const translators = useStreami18n(i18nInstance);

  // State rather than a memo: `client.user` is a plain field, so a memo would miss a language
  // changed server-side until something else re-rendered `Chat`.
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

  useConnectionLifecycle(client, closeConnectionOnBackground);
  usePendingUploadsDefault(client, enableOfflineSupport);

  const userId = useClientUserId(client);

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
      client.config.setConfig('client', { persistUserOnConnectionFailure: enableOfflineSupport });
    }
  }, [client, enableOfflineSupport]);

  const offlineDb = useInitializeOfflineDb({
    client,
    enabled: enableOfflineSupport,
    options: { getEncryptionKey: getOfflineDbEncryptionKey, maxSyncEventsLimit },
    userID: userId,
  });
  const { initialized: offlineDbInitialized, userId: offlineDbUserId } =
    useStateStore(offlineDb?.state, selector) ?? {};

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

  const initialisedDatabase = !!offlineDbInitialized && userId === offlineDbUserId;

  const getAppSettings = useAppSettingsGetter({
    client,
    ready: !enableOfflineSupport || initialisedDatabase,
    userId,
  });

  const chatContext = useCreateChatContext({ client, getAppSettings, isMessageAIGenerated });

  if (userId && enableOfflineSupport && !initialisedDatabase) {
    // Hold rendering until the offline database is initialized for this user.
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
 * Root component that provides the chat, translation and theme contexts to the components below it.
 *
 * Connection status is not on the chat context: read it with `useWSConnectionState()` (the socket)
 * or `useNetworkConnectionState()` (the device network).
 */
export const Chat = (props: PropsWithChildren<ChatProps>) => {
  const { theme } = useTheme();

  return <ChatWithContext style={theme} {...props} />;
};
