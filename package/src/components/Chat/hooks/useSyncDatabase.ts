import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type Params<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  client: StreamChat<StreamChatGenerics>;
  enableOfflineSupport: boolean;
  initialisedDatabase: boolean;
};
export const useSyncDatabase = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  enableOfflineSupport,
  initialisedDatabase,
}: Params<StreamChatGenerics>) => {
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
