import type { WSConnectionState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

const identity = (state: WSConnectionState) => state;

/**
 * This client's WebSocket status.
 *
 * Not the same fact as {@link useNetworkConnectionState}, and the difference is the point: a socket
 * dies on a perfectly good network (a server close, an expired token, a health-check timeout), and a
 * device drops while the socket has not noticed yet. Use this for "Reconnecting…"; use the network
 * hook for "you're offline".
 *
 * `isOnline` here is always a boolean — a socket always has a state — so `!isOnline` is safe, unlike
 * the network store's equivalent.
 *
 * Reads the store rather than reacting to `connection.changed`, so it is correct on mount rather than
 * only after the first transition, and so it reports the paths the event is silent about
 * (`client.closeConnection()`, the mobile backgrounding path, dispatches nothing).
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
