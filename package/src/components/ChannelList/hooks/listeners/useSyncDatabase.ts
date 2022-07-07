import { useEffect } from 'react';

import type { StreamChat } from 'stream-chat';

import { handleEventToSyncDB } from './handleEventToSyncDB';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Params = {
  enableOfflineSupport: boolean;
};
export const useSyncDatabase = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  enableOfflineSupport,
}: Params) => {
  const { client } = useChatContext<StreamChatGenerics>();
  useEffect(() => {
    let listener: ReturnType<StreamChat['on']>;

    if (enableOfflineSupport) {
      listener = client?.on(handleEventToSyncDB);
    }

    return () => {
      listener?.unsubscribe();
    };
  }, [client]);
};
