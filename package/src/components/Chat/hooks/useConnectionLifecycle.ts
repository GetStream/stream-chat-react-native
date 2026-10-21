import { useCallback, useEffect } from 'react';

import { AppState } from 'react-native';

import NetInfo from '@react-native-community/netinfo';

import type { NetworkStatusReporter, StreamChat } from 'stream-chat';

import { useAppStateListener } from '../../../hooks/useAppStateListener';

/**
 * Installs the NetInfo network status reporter on the client and closes the WebSocket while the app
 * is in the background, reopening it in the foreground (push notifications are only delivered while
 * no socket is active).
 *
 * Read the results with `useNetworkConnectionState()` and `useWSConnectionState()`.
 *
 * @param client The client to manage.
 * @param closeConnectionOnBackground Whether to close the socket while in the background.
 * Defaults to true.
 */
export const useConnectionLifecycle = (client: StreamChat, closeConnectionOnBackground = true) => {
  const clientExists = !!client;

  const onBackground = useCallback(() => {
    if (!closeConnectionOnBackground || !clientExists) {
      return;
    }

    client.closeConnection();
  }, [closeConnectionOnBackground, client, clientExists]);

  const onForeground = useCallback(() => {
    // Without a user ID, opening the connection would raise an unneeded error.
    if (!clientExists || !client.userID) {
      return;
    }

    client.openConnection();
  }, [client, clientExists]);

  useAppStateListener(onForeground, onBackground);

  // A `<Chat>` mounted while the app is already active (Android recreating the activity) never sees
  // the background-to-foreground change that reopens a socket its predecessor closed.
  useEffect(() => {
    if (!closeConnectionOnBackground || !clientExists || !client.userID) return;
    if (AppState.currentState === 'active' && client.wsConnection.connection?.isDisconnected) {
      client.openConnection();
    }
  }, [client, clientExists, closeConnectionOnBackground]);

  useEffect(() => {
    if (!clientExists) {
      return;
    }

    // Set through the client config so `client.config.get('client')` shows the installed reporter.
    // Required on React Native: the client's fallback mirrors its own WebSocket and cannot report
    // the network returning before the socket notices.
    client.config.set({
      client: {
        networkConnection: {
          statusReporter: netInfoStatusReporter,
        },
      },
    });

    // No teardown: the reporter lives as long as the client, which outlives `<Chat>`, and removing
    // it would leave a stale `isOnline` because `setStatusReporter(null)` keeps the last known
    // status. Re-running does not stack listeners: `netInfoStatusReporter` is a stable reference,
    // so a repeated write is a no-op.
  }, [client, clientExists]);
};

/**
 * Subscribes to NetInfo and reports every change to the client. `<Chat>` installs it in an effect.
 *
 * When you build the client yourself, install it at construction instead:
 *
 * ```ts
 * new StreamChat(apiKey, {
 *   client: { networkConnection: { statusReporter: netInfoStatusReporter } },
 * });
 * ```
 *
 * Until the effect runs, the client falls back to a reporter that mirrors its own WebSocket, which
 * records a socket-only failure (expired token, server close) as the device being offline.
 *
 * Defined at module scope so every install passes the same reference, which the client treats as a
 * no-op. NetInfo reports the current state on subscribe, so no `NetInfo.fetch()` is needed.
 */
export const netInfoStatusReporter: NetworkStatusReporter = (onStatusChange) =>
  NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
    // `isInternetReachable` is `null` until NetInfo has probed, so `isConnected` is used until
    // then.
    onStatusChange(
      isInternetReachable !== null ? isInternetReachable && isConnected : !!isConnected,
    );
  });
