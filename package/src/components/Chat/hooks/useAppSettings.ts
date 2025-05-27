import { useEffect, useRef, useState } from 'react';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

export const useAppSettings = (
  client: StreamChat,
  isOnline: boolean | null,
  enableOfflineSupport: boolean,
  initialisedDatabase: boolean,
): AppSettingsAPIResponse | null => {
  const [appSettings, setAppSettings] = useState<AppSettingsAPIResponse | null>(null);
  const appSettingsPromise = useRef<Promise<AppSettingsAPIResponse | null>>(null);
  const fetchedAppSettings = useRef(false);
  const isMounted = useIsMountedRef();

  useEffect(() => {
    if (fetchedAppSettings.current) {
      return;
    }

    const fetchAppSettings = () => {
      if (appSettingsPromise.current) {
        return appSettingsPromise.current;
      }
      appSettingsPromise.current = client.getAppSettings();
      return appSettingsPromise.current;
    };

    const enforceAppSettings = async () => {
      if (!client.userID) return;

      if (enableOfflineSupport && !initialisedDatabase) return;

      const userId = client.userID as string;

      if (!isOnline && client.offlineDb) {
        const appSettings = await client.offlineDb.getAppSettings({ userId });
        setAppSettings(appSettings);
        return;
      }

      try {
        const appSettings = await fetchAppSettings();
        if (isMounted.current && appSettings) {
          setAppSettings(appSettings);
          fetchedAppSettings.current = true;
          client.offlineDb?.executeQuerySafely(
            (db) => db.upsertAppSettings({ appSettings, userId }),
            { method: 'upsertAppSettings' },
          );
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`An error occurred while getting app settings: ${error}`);
        }
      }
    };

    enforceAppSettings();
  }, [client, isOnline, initialisedDatabase, isMounted, enableOfflineSupport]);

  return appSettings;
};
