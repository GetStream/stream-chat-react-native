import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
};

export const useUserPresence = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id]) {
            return channel;
          }
          channel.state.members[event.user.id].user = event.user;
          return channel;
        });

        return [...newChannels];
      });
    };

    client.on('user.presence.changed', handleEvent);
    client.on('user.updated', handleEvent);

    return () => {
      client.off('user.presence.changed', handleEvent);
      client.off('user.updated', handleEvent);
    };
  }, []);
};
