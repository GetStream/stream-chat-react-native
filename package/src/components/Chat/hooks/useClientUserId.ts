import { useCallback } from 'react';

import type { StreamChat } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/**
 * The id of the user connected to `client`, kept current as users connect and disconnect.
 *
 * This hook is TEMPORARY. It goes away once the client keeps its state (the connected user and the
 * app settings) in a store of its own, which components can subscribe to directly.
 *
 * The client has no store for its own user. `connectUser()` sets it right before opening the
 * socket and `disconnectUser()` clears it while closing it, so the socket and network stores
 * publishing around those calls are the signal to read it again. Re-renders only when the id
 * itself changes.
 */
export const useClientUserId = (client: StreamChat) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribeFunctions = [
        client.wsConnection?.state.subscribe(onChange),
        client.networkConnection?.state.subscribe(onChange),
      ];
      return () => unsubscribeFunctions.forEach((unsubscribe) => unsubscribe?.());
    },
    [client],
  );
  const getUserId = useCallback(() => client.userId, [client]);

  return useSyncExternalStore(subscribe, getUserId);
};
