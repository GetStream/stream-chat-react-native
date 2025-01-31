import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type {
  ChannelListEventListenerOptions,
  DefaultStreamChatGenerics,
} from '../../../../types/types';
import { getChannel, moveChannelUp } from '../../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onChannelVisible?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
      options?: ChannelListEventListenerOptions<StreamChatGenerics>,
    ) => void;
    options?: ChannelListEventListenerOptions<StreamChatGenerics>;
  };

export const useChannelVisible = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelVisible,
  options,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onChannelVisible === 'function') {
        onChannelVisible(setChannels, event);
      } else {
        if (!options) return;
        const { sort } = options;
        if (event.channel_id && event.channel_type) {
          const channel = await getChannel<StreamChatGenerics>({
            client,
            id: event.channel_id,
            type: event.channel_type,
          });
          setChannels((channels) =>
            channels
              ? moveChannelUp({
                  channels,
                  channelToMove: channel,
                  channelToMoveIndexWithinChannels: -1,
                  sort,
                })
              : channels,
          );
        }
      }
    };

    const listener = client?.on('channel.visible', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
