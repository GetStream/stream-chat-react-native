import { useEffect, useState } from 'react';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import { useIsMountedRef } from '../../../hooks/useIsMountedRef';
import * as dbApi from '../../../store/apis';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useAppSettings = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
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
    const enforceAppSettingsWithoutOfflineSupport = async () => {
      try {
        const appSettings = await client.getAppSettings();
        if (isMounted.current) {
          setAppSettings(appSettings);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`An error occurred while getting app settings: ${error}`);
        }
      }
    };

    /**
     * Fetches app settings from the local database when offline support is enabled if internet is off else fetches from the backend.
     * Note: We need to set the app settings from the local database when offline as the client will not have the app settings in memory. For this we store it for the `client.userID`.
     *
     * TODO: Remove client.userID usage for offline support case.
     */
    const enforceAppSettingsWithOfflineSupport = async () => {
      if (!client.userID) return;

      if (!isOnline) {
        const appSettings = dbApi.getAppSettings({ currentUserId: client.userID });
        setAppSettings(appSettings);
        return;
      }

      try {
        const appSettings = await client.getAppSettings();
        if (isMounted.current) {
          setAppSettings(appSettings);
          dbApi.upsertAppSettings({
            appSettings,
            currentUserId: client.userID as string,
          });
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`An error occurred while getting app settings: ${error}`);
        }
      }
    };

    async function enforeAppSettings() {
      if (enableOfflineSupport) {
        await enforceAppSettingsWithOfflineSupport();
      } else {
        await enforceAppSettingsWithoutOfflineSupport();
      }
    }

    enforeAppSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, isOnline, initialisedDatabase]);

  return appSettings;
};
