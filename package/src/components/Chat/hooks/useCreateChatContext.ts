import { useMemo } from 'react';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  client,
  connectionRecovering,
  isOnline,
  mutedUsers,
  setActiveChannel,
}: ChatContextValue<StreamChatGenerics>) => {
  const channelId = channel?.id;
  const clientValues = `${client.clientID}${Object.keys(client.activeChannels).length}${
    Object.keys(client.listeners).length
  }${client.mutedChannels.length}`;
  const mutedUsersLength = mutedUsers.length;

  const chatContext: ChatContextValue<StreamChatGenerics> = useMemo(
    () => ({
      channel,
      client,
      connectionRecovering,
      isOnline,
      mutedUsers,
      setActiveChannel,
    }),
    [channelId, clientValues, connectionRecovering, isOnline, mutedUsersLength],
  );

  return chatContext;
};
