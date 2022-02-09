import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useChannelDeleted = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelDeleted,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      if (typeof onChannelDeleted === 'function') {
        onChannelDeleted(setChannels, event);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (channel) => channel.cid === (event.cid || event.channel?.cid),
          );
          if (index >= 0) {
            channels.splice(index, 1);
          }
          return [...channels];
        });
      }
    };

    client.on('channel.deleted', handleEvent);
    return () => client.off('channel.deleted', handleEvent);
  }, []);
};
