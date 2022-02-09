import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useRemovedFromChannelNotification = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onRemovedFromChannel,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatClient>) => {
      if (typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, event);
      } else {
        setChannels((channels) => {
          const newChannels = channels.filter((channel) => channel.cid !== event.channel?.cid);
          return [...newChannels];
        });
      }
    };

    client.on('notification.removed_from_channel', handleEvent);
    return () => client.off('notification.removed_from_channel', handleEvent);
  }, []);
};
