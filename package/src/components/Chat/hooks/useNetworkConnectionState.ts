import type { NetworkConnectionState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

const identity = (state: NetworkConnectionState) => state;

/**
 * The device's network status, as reported by the NetInfo listener `<Chat>` registers on
 * `client.networkConnection`. Unlike {@link useWSConnectionState}, it is not affected by the socket
 * dying on a working network.
 *
 * `isOnline` is `undefined` until a status is reported, so test `isOnline === false`: `!isOnline`
 * would also read as offline on the first render and where no listener is installed.
 *
 * Must be used under `<Chat>`.
 *
 * @returns The network connection state, or `undefined` when the client has no network store.
 */
export const useNetworkConnectionState = () => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection?.state, identity);
};

/**
 * {@link useNetworkConnectionState} narrowed by `selector`, so the component re-renders only when
 * the selected values change. The selector must return a flat object or tuple (shallow-compared)
 * and be declared at module scope to stay referentially stable.
 *
 * @param selector Picks the values to subscribe to.
 * @returns The selected values, or `undefined` when the client has no network store.
 */
export const useNetworkConnectionStateSelector = <
  O extends Readonly<Record<string, unknown> | Readonly<unknown[]>>,
>(
  selector: (state: NetworkConnectionState) => O,
) => {
  const { client } = useChatContext();
  return useStateStore(client?.networkConnection?.state, selector);
};
