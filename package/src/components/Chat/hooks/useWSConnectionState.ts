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
 * This client's WebSocket status.
 *
 * Not the same fact as {@link useNetworkConnectionState}, and the difference is the point: a socket
 * dies on a perfectly good network (a server close, an expired token, a health-check timeout), and a
 * device drops while the socket has not noticed yet. Use this for "Reconnecting…"; use the network
 * hook for "you're offline".
 *
 * `isHealthy` is always a boolean — a socket always has a state — so `!isHealthy` is safe, unlike the
 * network store's `isOnline`, which is `undefined` until something reports.
 *
 * Reads the store rather than reacting to an event, so it is correct on mount rather than only after
 * the first transition, and so it reports the paths that were always silent
 * (`client.closeConnection()`, the mobile backgrounding path, dispatches nothing).
 *
 * This is the **raw** status, and it has a trap: `isHealthy` is `false` from construction, so it
 * reads the same before the first connect as it does after a drop. Those need opposite UI — one is
 * "connecting", the other is "we lost it" — and only `lastHealthyAt === null` tells them apart.
 * Anything user-visible wants {@link useSettledWSConnectionHealth}, which handles that and the flap
 * debounce; reach for this one only when you genuinely want the unfiltered store.
 *
 * Must be used under `<Chat>`.
 */
export const useWSConnectionState = () => {
  const { client } = useChatContext();
  return useStateStore(client?.wsConnection?.state, identity);
};

/**
 * {@link useWSConnectionState} narrowed to what a component actually reads, so it re-renders only
 * when that changes. The selector must return a flat object or tuple — it is shallow-compared on its
 * own keys, and must be declared at module scope to stay referentially stable.
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
 * `isHealthy`, but a drop has to last before it is believed. What UI should render.
 *
 * Recovery is reported immediately and only the drop is held back, because the two are not
 * symmetric: showing "Reconnecting…" a moment late costs nothing, leaving it up a moment too long
 * makes a working app look broken.
 *
 * Most drops resolve in well under a second — a backgrounded socket, a handover between cells, a
 * server closing an idle connection — and a banner that rendered all of them would flash constantly.
 * The client used to hold this back itself, debouncing its offline event by a fixed five seconds;
 * that timer outlived the socket that armed it, so it was removed in favour of the value living
 * here, where whoever draws the banner owns it. The length is
 * `client.config.set({ client: { wsConnection: { offlineNotificationDisplayDelayMs } } })`; zero
 * holds nothing back.
 *
 * A socket that is already down when this mounts reads as down straight away — there is no flap to
 * wait out. A socket that has never been up is a different case: that is a first connect, not a
 * drop, so it reads as healthy until the delay says otherwise.
 *
 * Must be used under `<Chat>`.
 */
export const useSettledWSConnectionHealth = () => {
  const { client } = useChatContext();
  const status = useStateStore(client?.wsConnection?.state, healthSelector);
  const isHealthy = !!status?.isHealthy;
  const hasBeenHealthy = !!status?.lastHealthyAt;
  // `=== false` is the device telling us it has no network, which is a different thing from
  // `undefined`, meaning nobody has reported yet.
  const networkIsDown =
    useStateStore(client?.networkConnection?.state, networkSelector)?.isOnline === false;
  const delay =
    useStateStore(client?.wsConnection?.configState, displayDelaySelector)
      ?.offlineNotificationDisplayDelayMs ?? 0;

  const [settled, setSettled] = useState(() => isHealthy || (!hasBeenHealthy && !networkIsDown));

  useEffect(() => {
    // Up is immediate, and clearing any pending down with it: a socket that came back before the
    // timer fired must never announce the drop it already recovered from — the exact bug that
    // retiring the client-side timer was meant to end.
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
