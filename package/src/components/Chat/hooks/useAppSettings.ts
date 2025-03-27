import { useEffect, useState } from 'react';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import { useIsMountedRef } from '../../../hooks/useIsMountedRef';

export const useAppSettings = (
  client: StreamChat,
  isOnline: boolean | null,
  enableOfflineSupport: boolean,
  initialisedDatabase: boolean,
): AppSettingsAPIResponse | null => {
  const [appSettings, setAppSettings] = useState<AppSettingsAPIResponse | null>(null);
  const isMounted = useIsMountedRef();

  useEffect(() => {
    /**
     * Fetches app settings from the backend when offline support is disabled.
     */

    /**
     * Fetches app settings from the local database when offline support is enabled if internet is off else fetches from the backend.
     * Note: We need to set the app settings from the local database when offline as the client will not have the app settings in memory. For this we store it for the `client.userID`.
     *
     * TODO: Remove client.userID usage for offline support case.
     */

    async function enforceAppSettings() {
      if (!client.userID) {
        return;
      }

      if (enableOfflineSupport && !initialisedDatabase) {
        return;
      }

      try {
        const appSettings = (await client.getAppSettings()) as AppSettingsAPIResponse;
        if (isMounted.current) {
          setAppSettings(appSettings);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`An error occurred while getting app settings: ${error}`);
        }
      }
    }

    enforceAppSettings();
  }, [client, isOnline, initialisedDatabase, enableOfflineSupport, isMounted]);

  return appSettings;
};
