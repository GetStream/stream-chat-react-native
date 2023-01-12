import { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { getChannel } from '../../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onChannelVisible?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useChannelVisible = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelVisible,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onChannelVisible === 'function') {
        onChannelVisible(setChannels, event);
      } else {
        if (event.channel_id && event.channel_type) {
          const channel = await getChannel<StreamChatGenerics>({
            client,
            id: event.channel_id,
            type: event.channel_type,
          });
          setChannels((channels) => (channels ? uniqBy([channel, ...channels], 'cid') : channels));
        }
      }
    };

    const listener = client?.on('channel.visible', handleEvent);
    return () => listener?.unsubscribe();
  }, []);
};
