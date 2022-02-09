import { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { getChannel } from '../../utils';

type Parameters<StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useChannelVisible = <
  StreamChatClient extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelVisible,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatClient>) => {
      if (typeof onChannelVisible === 'function') {
        onChannelVisible(setChannels, event);
      } else {
        if (event.channel_id && event.channel_type) {
          const channel = await getChannel<StreamChatClient>({
            client,
            id: event.channel_id,
            type: event.channel_type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('channel.visible', handleEvent);
    return () => client.off('channel.visible', handleEvent);
  }, []);
};
