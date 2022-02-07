import { useEffect } from 'react';

import type { Channel, Event, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  refreshList: () => void;
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useChannelTruncated = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  onChannelTruncated,
  refreshList,
  setChannels,
  setForceUpdate,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      if (typeof onChannelTruncated === 'function') {
        onChannelTruncated(setChannels, event);
      }
      refreshList();
      setForceUpdate((count) => count + 1);
    };

    client.on('channel.truncated', handleEvent);
    return () => client.off('channel.truncated', handleEvent);
  }, []);
};
