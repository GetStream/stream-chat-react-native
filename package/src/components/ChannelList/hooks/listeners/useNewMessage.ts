import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { moveChannelUp } from '../../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    lockChannelOrder: boolean;
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[]>>;
  };

export const useNewMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  lockChannelOrder,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setChannels((channels) => {
        if (!lockChannelOrder && event.cid && event.channel_type && event.channel_id) {
          const targetChannelIndex = channels.findIndex((c) => c.cid === event.cid);

          if (targetChannelIndex >= 0) {
            return moveChannelUp<StreamChatGenerics>({
              channels,
              cid: event.cid,
            });
          }

          // If channel doesn't exist in existing list, check in activeChannels as well.
          // It may happen that channel was hidden using channel.hide(). In that case
          // We remove it from `channels` state, but its still being watched and exists in client.activeChannels.
          const channel = client.channel(event.channel_type, event.channel_id);

          if (channel.initialized) {
            return [channel, ...channels];
          }
        }

        return [...channels];
      });
    };

    const listener = client?.on('message.new', handleEvent);
    return () => listener?.unsubscribe();
  }, []);
};
