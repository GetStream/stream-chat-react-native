import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>;
    onChannelUpdated?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useChannelUpdated = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelUpdated,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
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
