import { useEffect, useRef, useState } from 'react';

import type { AppSettingsAPIResponse, StreamChat } from 'stream-chat';
import type { DefaultStreamChatGenerics } from 'stream-chat-react-native';

export const useAppSettings = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  isOnline: boolean,
): AppSettingsAPIResponse | null => {
  const [appSettings, setAppSettings] = useState<AppSettingsAPIResponse | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    async function getAppSettings() {
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
    }

    if (isOnline) {
      // getAppSettings();
    }

    return () => {
      isMounted.current = false;
    };
  }, [client, isOnline]);

  return appSettings;
};
