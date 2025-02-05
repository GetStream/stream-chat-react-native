import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type {
  ChannelListEventListenerOptions,
  DefaultStreamChatGenerics,
} from '../../../../types/types';
import { getChannel, moveChannelUp } from '../../utils';
import { isChannelArchived } from '../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onNewMessageNotification?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
      options?: ChannelListEventListenerOptions<StreamChatGenerics>,
    ) => void;
    options?: ChannelListEventListenerOptions<StreamChatGenerics>;
  };

export const useNewMessageNotification = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onNewMessageNotification,
  options,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onNewMessageNotification === 'function') {
        onNewMessageNotification(setChannels, event, options);
      } else {
        if (!options) return;
        const { filters, sort } = options;
        if (event.channel?.id && event.channel?.type) {
          const channel = await getChannel({
            client,
            id: event.channel.id,
            type: event.channel.type,
          });

          // Handle archived channels
          const considerArchivedChannels = filters && filters.archived === false;
          if (isChannelArchived(channel) && considerArchivedChannels) {
            return;
          }

          setChannels((channels) =>
            channels
              ? moveChannelUp({
                  channels,
                  channelToMove: channel,
                  sort,
                })
              : channels,
          );
        }
      }
    };

    const listener = client?.on('notification.message_new', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
