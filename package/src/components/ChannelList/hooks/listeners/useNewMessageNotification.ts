import { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, Event, ExtendableGenerics } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { getChannel } from '../../utils';

type Parameters<StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics> = {
  setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>;
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatClient>[]>>,
    event: Event<StreamChatClient>,
  ) => void;
};

export const useNewMessageNotification = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  onMessageNew,
  setChannels,
}: Parameters<StreamChatClient>) => {
  const { client } = useChatContext<StreamChatClient>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatClient>) => {
      if (typeof onMessageNew === 'function') {
        onMessageNew(setChannels, event);
      } else {
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });
          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
        }
      }
    };

    client.on('notification.message_new', handleEvent);
    return () => client.off('notification.message_new', handleEvent);
  }, []);
};
