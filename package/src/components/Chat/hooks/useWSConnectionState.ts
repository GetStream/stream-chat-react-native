import { useEffect, useState } from 'react';

import type { NetworkConnectionState, WSConnectionConfig, WSConnectionState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

const identity = (state: WSConnectionState) => state;
const healthSelector = (state: WSConnectionState) => ({
  isHealthy: state.isHealthy,
  lastHealthyAt: state.lastHealthyAt,
});
const displayDelaySelector = (config: WSConnectionConfig) => ({
  offlineNotificationDisplayDelayMs: config.offlineNotificationDisplayDelayMs,
});
const networkSelector = (state: NetworkConnectionState) => ({ isOnline: state.isOnline });

/**
 * The client's WebSocket status. Unlike {@link useNetworkConnectionState}, which reports the device
 * network, a socket can drop on a good network and the network can drop before the socket notices.
 *
 * This is the raw status: `isHealthy` is `false` from construction, so it reads the same before the
 * first connect as after a drop, and only `lastHealthyAt === null` tells them apart. Prefer
 * {@link useSettledWSConnectionHealth} for UI.
 *
 * Must be used under `<Chat>`.
 *
 * @returns The WebSocket connection state, or `undefined` when the client has no connection store.
 */
export const useWSConnectionState = () => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection?.state, identity);
};

/**
 * {@link useWSConnectionState} narrowed by `selector`, so the component re-renders only when the
 * selected values change. The selector must return a flat object or tuple (shallow-compared) and be
 * declared at module scope to stay referentially stable.
 *
 * @param selector Picks the values to subscribe to.
 * @returns The selected values, or `undefined` when the client has no connection store.
 */
export const useWSConnectionStateSelector = <
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (state: WSConnectionState) => O,
) => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection?.state, selector);
};

/**
 * `isHealthy` with drops debounced, so brief reconnects do not flash a banner. Recovery is reported
 * immediately; a drop only reads as unhealthy once it has lasted the client's
 * `wsConnection.offlineNotificationDisplayDelayMs` (0 disables the delay).
 *
 * A socket that has been up and is down on mount reads as down at once. One that has never been up
 * is a first connect, not a drop, so it reads as healthy until the delay elapses or the network is
 * known to be down.
 *
 * Must be used under `<Chat>`.
 *
 * @returns Whether the connection counts as healthy.
 */
export const useSettledWSConnectionHealth = () => {
  const { client } = useChatContext();
  const status = useStateStore(client?.wsConnection?.state, healthSelector);
  const isHealthy = !!status?.isHealthy;
  const hasBeenHealthy = !!status?.lastHealthyAt;
  // `undefined` means no network status has been reported yet, which is not offline.
  const networkIsDown =
    useStateStore(client?.networkConnection?.state, networkSelector)?.isOnline === false;
  const delay =
    useStateStore(client?.wsConnection?.configState, displayDelaySelector)
      ?.offlineNotificationDisplayDelayMs ?? 0;

  const [settled, setSettled] = useState(() => isHealthy || (!hasBeenHealthy && !networkIsDown));

  useEffect(() => {
    // Recovery is immediate and cancels a pending drop, so a recovered socket never reports one.
    if (isHealthy) {
      setSettled(true);
      return;
    }

    if (delay <= 0 || networkIsDown) {
      setSettled(false);
      return;
    }

    const timeout = setTimeout(() => setSettled(false), delay);
    return () => clearTimeout(timeout);
  }, [isHealthy, delay, networkIsDown]);

  return settled;
};
