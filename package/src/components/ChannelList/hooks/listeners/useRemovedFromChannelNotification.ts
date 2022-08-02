import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>;
    onRemovedFromChannel?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useRemovedFromChannelNotification = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onRemovedFromChannel,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (typeof onRemovedFromChannel === 'function') {
        onRemovedFromChannel(setChannels, event);
      } else {
        setChannels((channels) => {
          const newChannels = channels.filter((channel) => channel.cid !== event.channel?.cid);
          return [...newChannels];
        });
      }
    };

    const listener = client?.on('notification.removed_from_channel', handleEvent);
    return () => listener?.unsubscribe();
  }, []);
};
