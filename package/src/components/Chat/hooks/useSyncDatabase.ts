import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import type { DefaultStreamChatGenerics } from '../../../types/types';

type Params<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  client: StreamChat<StreamChatGenerics>;
  enableOfflineSupport: boolean;
};
export const useSyncDatabase = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  client,
  enableOfflineSupport,
}: Params<StreamChatGenerics>) => {
  useEffect(() => {
    let listener: ReturnType<StreamChat['on']> | undefined;

    if (enableOfflineSupport) {
      listener = client?.on(handleEventToSyncDB);
    }

    return () => {
      listener?.unsubscribe();
    };
  }, [client]);
};
