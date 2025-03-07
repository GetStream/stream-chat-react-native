import React, { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

type Parameters = {
  refreshList: () => void;
  setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[] | null>>,
    event: Event,
  ) => void;
};

export const useChannelTruncated = ({
  onChannelTruncated,
  refreshList,
  setChannels,
  setForceUpdate,
}: Parameters) => {
  const { client } = useChatContext();

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (typeof onChannelTruncated === 'function') {
        onChannelTruncated(setChannels, event);
      }
      refreshList();
      setForceUpdate((count) => count + 1);
    };

    const listener = client?.on('channel.truncated', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
