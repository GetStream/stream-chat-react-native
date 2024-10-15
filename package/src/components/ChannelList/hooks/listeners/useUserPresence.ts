import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    setForceUpdate: React.Dispatch<React.SetStateAction<number>>;
  };

export const useUserPresence = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  setChannels,
  setForceUpdate,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setChannels((channels) => {
        if (!channels) return channels;

        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id]) {
            return channel;
          }
          channel.state.members[event.user.id].user = event.user;
          return channel;
        });

        return [...newChannels];
      });
      setForceUpdate((u) => u + 1);
    };

    const listeners = [
      client?.on('user.presence.changed', handleEvent),
      client?.on('user.updated', handleEvent),
    ];

    return () => {
      listeners?.forEach((l) => l?.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
