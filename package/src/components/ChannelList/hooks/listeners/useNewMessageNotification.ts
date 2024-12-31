import { useEffect } from 'react';

import uniqBy from 'lodash/uniqBy';

import type { Channel, ChannelFilters, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';
import { getChannel } from '../../utils';
import { isChannelArchived } from '../utils';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    filters?: ChannelFilters<StreamChatGenerics>;
    onNewMessageNotification?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
      filters?: ChannelFilters<StreamChatGenerics>,
    ) => void;
  };

export const useNewMessageNotification = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  filters,
  onNewMessageNotification,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onNewMessageNotification === 'function') {
        onNewMessageNotification(setChannels, event, filters);
      } else {
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

          setChannels((channels) => (channels ? uniqBy([channel, ...channels], 'cid') : channels));
        }
      }
    };

    const listener = client?.on('notification.message_new', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
