import { useEffect } from 'react';

import type { Channel, Event, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { moveChannelUp } from '../../utils';

type Parameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  lockChannelOrder: boolean;
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
};

export const useNewMessage = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  lockChannelOrder,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      setChannels((channels) => {
        if (!lockChannelOrder && event.cid) {
          return moveChannelUp<StreamChatClient>({
            channels,
            cid: event.cid,
          });
        }
        return [...channels];
      });
    };

    client.on('message.new', handleEvent);
    return () => client.off('message.new', handleEvent);
  }, []);
};
