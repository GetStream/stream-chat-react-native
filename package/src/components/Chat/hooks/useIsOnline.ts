import { useCallback, useEffect } from 'react';

import NetInfo from '@react-native-community/netinfo';

import type { NetworkStatusReporter, StreamChat } from 'stream-chat';

import { useAppStateListener } from '../../../hooks/useAppStateListener';

/**
 * Reports the device's network status to the client, and owns the socket's app-state lifecycle.
 *
 * Two jobs, both side effects — this hook returns nothing. Read status with
 * `useNetworkConnectionState()` (the device) or `useWSConnectionState()` (our socket); both read the
 * client's own stores, so they are correct on mount rather than only after a transition.
 *
 * 1. **The network reporter.** The client cannot detect device network status itself — every
 *    platform reports it differently — so it has to be told. On React Native that means NetInfo.
 * 2. **Background/foreground.** Close the socket when the app backgrounds and reopen it on
 *    foreground, because push notifications are only delivered while no socket is active.
 */
export const useIsOnline = (client: StreamChat, closeConnectionOnBackground = true) => {
  const clientExists = !!client;

  const onBackground = useCallback(() => {
    if (!closeConnectionOnBackground || !clientExists) {
      return;
    }

    client.closeConnection();
  }, [closeConnectionOnBackground, client, clientExists]);

  const onForeground = useCallback(() => {
    // If the user id is not set, we should not open the connection, as it will raise an unneeded error
    if (!clientExists || !client.userID) {
      return;
    }

    client.openConnection();
  }, [client, clientExists]);

  useAppStateListener(onForeground, onBackground);

  useEffect(() => {
    if (!clientExists) {
      return;
    }

    // Declarative config rather than `client.networkConnection.setStatusReporter(...)`. Both survive
    // a configuration derivation now, but this one states the reporter as part of the client's
    // configuration rather than as an edit applied to it, so a `client.config.get('client')` shows
    // what is actually installed.
    //
    // Installing one at all is not optional on React Native. Left alone the client falls back to a
    // reporter that mirrors its own WebSocket, which cannot report that the network came back before
    // the socket noticed — the entire reason the network signal is worth having.
    client.config.set({
      client: {
        networkConnection: {
          statusReporter: netInfoStatusReporter,
        },
      },
    });

    // Deliberately no teardown. The reporter's lifetime is the CLIENT's, not this component's: the
    // client outlives `<Chat>` (push handling, background work), and `isOnline` is supposed to stay
    // true about the device for as long as the client exists. Tearing it down here would also leave a
    // stale value rather than a cleared one — `setStatusReporter(null)` keeps the last known status by
    // design — so consumers would read an authoritative-looking `isOnline` that nothing is updating
    // any more.
    //
    // Re-running this is safe and cannot stack listeners: `netInfoStatusReporter` is a stable
    // module-scope reference, so `ConfigController`'s no-op write check and the observer's own
    // installed-reporter identity guard both short-circuit. A *different* client re-runs the effect
    // through the dependency array and installs a fresh reporter for it.
  }, [client, clientExists]);
};

/**
 * Subscribes to NetInfo and reports every change to the client. What `<Chat>` installs.
 *
 * Exported so it can be installed **at client construction** instead, which is strictly better if
 * you build the client yourself:
 *
 * ```ts
 * new StreamChat(apiKey, {
 *   config: { client: { networkConnection: { statusReporter: netInfoStatusReporter } } },
 * });
 * ```
 *
 * `<Chat>` can only install it from an effect, so between the client being constructed and that
 * effect running, the client falls back to a reporter that mirrors its own WebSocket. In that window
 * a socket-only failure — an expired token, a server close — is recorded as the *device* having no
 * network, and the UI blames the network for it. Installing here closes the window; the fallback is
 * never reached.
 *
 * Module scope, so the same reference is handed to the client on every derivation — re-installing an
 * identical reporter is a no-op there, and rebuilding it per render would tear the native listener
 * down and recreate it for nothing.
 *
 * `NetInfo.addEventListener` fires once with the current state on subscribe, which satisfies the
 * reporter contract's "report the current status as soon as it is known" requirement — so no
 * separate `NetInfo.fetch()` is needed.
 */
export const netInfoStatusReporter: NetworkStatusReporter = (onStatusChange) =>
  NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
    // `isInternetReachable` is the stronger signal but is `null` until NetInfo has probed, so fall
    // back to `isConnected` until it resolves. Coerced because both are `boolean | null`.
    onStatusChange(
      isInternetReachable !== null ? isInternetReachable && isConnected : !!isConnected,
    );
  });
