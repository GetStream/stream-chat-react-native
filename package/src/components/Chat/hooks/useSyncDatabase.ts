import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

// import { handleEventToSyncDB } from './handleEventToSyncDB';

type Params = {
  client: StreamChat;
  enableOfflineSupport: boolean;
  initialisedDatabase: boolean;
};
// TODO: Remove
export const useSyncDatabase = ({ client, initialisedDatabase }: Params) => {
  useEffect(() => {
    let listener: ReturnType<StreamChat['on']> | undefined;

    // if (enableOfflineSupport && initialisedDatabase) {
    //   listener = client?.on((event) => handleEventToSyncDB(event, client));
    // }

    return () => {
      listener?.unsubscribe();
    };
  }, [client, initialisedDatabase]);
};
