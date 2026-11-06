import { useCallback } from 'react';

import type { StreamChat } from 'stream-chat';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/**
 * The ID of the user connected to `client`, kept current as users connect and disconnect.
 *
 * The client has no store for its own user, so this re-reads it whenever the WebSocket or network
 * store publishes, which `connectUser()` and `disconnectUser()` cause. Re-renders only when the ID
 * changes.
 *
 * @param client The client to read the user from.
 * @returns The connected user's ID, or `undefined` when no user is connected.
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
