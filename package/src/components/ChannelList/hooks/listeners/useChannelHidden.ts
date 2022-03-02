import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>;
    onChannelHidden?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useChannelHidden = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelHidden,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (typeof onChannelHidden === 'function') {
        onChannelHidden(setChannels, event);
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

    client.on('channel.hidden', handleEvent);
    return () => client.off('channel.hidden', handleEvent);
  }, []);
};
