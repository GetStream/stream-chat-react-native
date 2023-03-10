import { useEffect, useRef, useState } from 'react';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';

import * as dbApi from '../../../store/apis';
import type { DefaultStreamChatGenerics } from '../../../types/types';
export const useAppSettings = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  isOnline: boolean | null,
  enableOfflineSupport: boolean,
  initialisingDatabase: boolean,
): AppSettingsAPIResponse | null => {
  const [appSettings, setAppSettings] = useState<AppSettingsAPIResponse | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    async function enforeAppSettings() {
      if (initialisingDatabase) return;
      if (!client.userID) return;

      if (!isOnline && enableOfflineSupport) {
        const appSettings = dbApi.getAppSettings({ currentUserId: client.userID });
        setAppSettings(appSettings);
        return;
      }

      try {
        const appSettings = await client.getAppSettings();
        if (isMounted.current) {
          setAppSettings(appSettings);
          enableOfflineSupport &&
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
    }

    enforeAppSettings();

    return () => {
      isMounted.current = false;
    };
  }, [client, isOnline, initialisingDatabase]);

  return appSettings;
};
