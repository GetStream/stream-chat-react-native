import { useEffect } from 'react';

import type { Channel, Event, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useChannelUpdated = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  onChannelUpdated,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      if (typeof onChannelUpdated === 'function') {
        onChannelUpdated(setChannels, event);
      } else {
        setChannels((channels) => {
          const index = channels.findIndex(
            (channel) => channel.cid === (event.cid || event.channel?.cid),
          );
          if (index >= 0 && event.channel) {
            channels[index].data = event.channel;
          }
          return [...channels];
        });
      }
    };

    client.on('channel.updated', handleEvent);
    return () => client.off('channel.updated', handleEvent);
  }, []);
};
