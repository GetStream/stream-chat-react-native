import { useEffect, useRef } from 'react';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters = {
  refreshList: () => void;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
};

export const useConnectionRecovered = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  refreshList,
  setForceUpdate,
}: Parameters) => {
  const { client } = useChatContext<StreamChatClient>();

  const refRefreshList = useRef(refreshList);
  refRefreshList.current = refreshList;

  useEffect(() => {
    const handleEvent = () => {
      refRefreshList.current();
      setForceUpdate((count) => count + 1);
    };

    const { unsubscribe: unsubscribeRecovered } = client.on('connection.recovered', handleEvent);
    const { unsubscribe: unsubscribeChanged } = client.on('connection.changed', (event) => {
      if (event.online) {
        handleEvent();
      }
    });

    return () => {
      unsubscribeRecovered();
      unsubscribeChanged();
    };
  }, []);
};
