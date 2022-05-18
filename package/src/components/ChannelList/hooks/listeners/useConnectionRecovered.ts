import { useEffect, useRef } from 'react';
import type { StreamChat } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters = {
  refreshList: () => void;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useConnectionRecovered = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  refreshList,
  setForceUpdate,
}: Parameters) => {
  const { client } = useChatContext<StreamChatGenerics>();

  const refRefreshList = useRef(refreshList);
  refRefreshList.current = refreshList;

  useEffect(() => {
    const handleEvent = () => {
      refRefreshList.current();
      setForceUpdate((count) => count + 1);
    };

    let connectionRecoveredListener: ReturnType<StreamChat['on']>;
    let connectionChangedListener: ReturnType<StreamChat['on']>;

    if (client) {
      connectionRecoveredListener = client.on('connection.recovered', handleEvent);
      connectionChangedListener = client.on('connection.changed', (event) => {
        if (event.online) {
          handleEvent();
        }
      });
    }

    return () => {
      connectionRecoveredListener?.unsubscribe?.();
      connectionChangedListener?.unsubscribe?.();
    };
  }, [client]);
};
