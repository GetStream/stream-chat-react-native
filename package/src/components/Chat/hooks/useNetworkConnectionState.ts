import type { NetworkConnectionState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

const identity = (state: NetworkConnectionState) => state;

/**
 * The **device's** network status, as reported by the NetInfo listener `<Chat>` registers on
 * `client.networkConnection`.
 *
 * Not the same fact as {@link useWSConnectionState}: a socket dies on a working network, and a device
 * drops while the socket has not noticed yet. Use this for "you're offline"; use the WebSocket hook
 * for "Reconnecting…".
 *
 * `isOnline` has **three** states. `undefined` means *unknown* — nobody has reported yet. A guard must
 * therefore test `isOnline === false`; `!isOnline` is also true when the answer is unknown, which
 * would claim "offline" on the very first render and on any host where no listener is installed.
 *
 * Must be used under `<Chat>`.
 */
export const useNetworkConnectionState = () => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection?.state, identity);
};

/**
 * {@link useNetworkConnectionState} narrowed to what a component actually reads, so it re-renders only
 * when that changes. The selector must return a flat object or tuple — it is shallow-compared on its
 * own keys, and must be declared at module scope to stay referentially stable.
 */
export const useNetworkConnectionStateSelector = <
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (state: NetworkConnectionState) => O,
) => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection?.state, selector);
};
