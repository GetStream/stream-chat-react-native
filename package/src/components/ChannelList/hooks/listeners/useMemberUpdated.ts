import { useEffect } from 'react';

import type { Channel, Event } from 'stream-chat';

import { useChatContext } from '../../../../contexts/chatContext/ChatContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

type Parameters<StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics> =
  {
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>;
    onChannelMemberUpdated?: (
      setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
      event: Event<StreamChatGenerics>,
    ) => void;
  };

export const useChannelMemberUpdated = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  onChannelMemberUpdated,
  setChannels,
}: Parameters<StreamChatGenerics>) => {
  const { client } = useChatContext<StreamChatGenerics>();

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (typeof onChannelMemberUpdated === 'function') {
        onChannelMemberUpdated(setChannels, event);
      } else {
        if (!event.member?.user || event.member.user.id !== client.userID || !event.channel_type) {
          return;
        }
        const member = event.member;
        const channelType = event.channel_type;
        const channelId = event.channel_id;

        setChannels((currentChannels) => {
          if (!currentChannels) return currentChannels;

          const targetChannel = client.channel(channelType, channelId);
          // assumes that channel instances are not changing
          const targetChannelIndex = currentChannels.indexOf(targetChannel);
          const targetChannelExistsWithinList = targetChannelIndex >= 0;

          const newChannels = [...currentChannels];

          if (targetChannelExistsWithinList) {
            newChannels.splice(targetChannelIndex, 1);
          }

          // handle archiving (remove channel)
          if (typeof member.archived_at === 'string') {
            return newChannels;
          }
          return currentChannels;
        });
      }
    };

    const listener = client?.on('member.updated', handleEvent);
    return () => listener?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
