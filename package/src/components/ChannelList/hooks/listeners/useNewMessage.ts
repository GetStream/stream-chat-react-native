import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { moveChannelUp } from '../../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    lockChannelOrder: boolean;
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onNewMessage?: (
      lockChannelOrder: boolean,
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useNewMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  lockChannelOrder,
  onNewMessage,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (typeof onNewMessage === 'function') {
        onNewMessage(lockChannelOrder, setChannels, event);
      } else {
        setChannels((channels) => {
          if (!channels) return channels;

          if (!lockChannelOrder && event.cid && event.channel_type && event.channel_id) {
            const targetChannelIndex = channels.findIndex((c) => c.cid === event.cid);

            if (targetChannelIndex >= 0) {
              return moveChannelUp<StreamChatGenerics>({
                channels,
                cid: event.cid,
              });
            }
          }
          return [...channels];
        });
      }
    };

    const listener = client?.on('message.new', handleEvent);
    return () => listener?.unsubscribe();
  }, []);
};
