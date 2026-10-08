import { useEffect, useRef } from 'react';

import type { GetApplicationResponse, StreamChat } from 'stream-chat';

import { useStableCallback } from '../../../hooks/useStableCallback';

type AppSettingsRequest = {
  client: StreamChat;
  promise: Promise<GetApplicationResponse>;
  token: object;
  userId: string | undefined;
};

/**
 * A stable `getAppSettings()` for the chat context. The first call for a user fetches the app
 * settings and later calls reuse them. With offline support, a successful fetch is copied to the offline
 * database and a failed one falls back to that copy. A failed fetch is not kept, so the next call
 * fetches again.
 *
 * The settings are requested once `ready` and a user is connected, so they are usually loaded by
 * the time anything asks for them.
 */
export const useAppSettingsGetter = ({
  client,
  ready,
  userId,
}: {
  client: StreamChat;
  ready: boolean;
  userId: string | undefined;
}) => {
  const requestRef = useRef<AppSettingsRequest>(undefined);

  const getAppSettings = useStableCallback(() => {
    if (requestRef.current?.client === client && requestRef.current.userId === userId) {
      return requestRef.current.promise;
    }

    const token = {};
    const load = async () => {
      try {
        const appSettings = await client.getAppSettings();
        if (userId) {
          client.offlineDb?.executeQuerySafely(
            (db) => db.upsertAppSettings({ appSettings, userId }),
            { method: 'upsertAppSettings' },
          );
        }
        return appSettings;
      } catch (error) {
        if (requestRef.current?.token === token) {
          requestRef.current = undefined;
        }
        const storedAppSettings = userId
          ? await client.offlineDb?.getAppSettings({ userId }).catch(() => null)
          : null;
        if (storedAppSettings) {
          return storedAppSettings;
        }
        throw error;
      }
    };
    const request = { client, promise: load(), token, userId };
    requestRef.current = request;
    return request.promise;
  });

  useEffect(() => {
    if (!ready || !userId) {
      return;
    }
    getAppSettings().catch((error: unknown) => {
      if (error instanceof Error) {
        console.error(`An error occurred while getting app settings: ${error}`);
      }
    });
  }, [getAppSettings, ready, userId]);

  return getAppSettings;
};
