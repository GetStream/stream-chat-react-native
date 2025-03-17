import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

type Params = {
  client: StreamChat;
  enableOfflineSupport: boolean;
  initialisedDatabase: boolean;
};
export const useSyncDatabase = ({ client, enableOfflineSupport, initialisedDatabase }: Params) => {
  useEffect(() => {
    let listener: ReturnType<StreamChat['on']> | undefined;

    if (enableOfflineSupport && initialisedDatabase) {
      listener = client?.on((event) => handleEventToSyncDB(event, client));
    }

    return () => {
      listener?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, initialisedDatabase]);
};
