import { useMemo } from 'react';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateChatContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  appSettings,
  channel,
  client,
  connectionRecovering,
  enableOfflineSupport,
  ImageComponent,
  isOnline,
  mutedUsers,
  setActiveChannel,
}: ChatContextValue<StreamChatGenerics>) => {
  const channelId = channel?.id;
  const clientValues = client
    ? `${client.clientID}${Object.keys(client.activeChannels).length}${
        Object.keys(client.listeners).length
      }${client.mutedChannels.length}`
    : 'Offline';
  const mutedUsersLength = mutedUsers.length;

  const chatContext: ChatContextValue<StreamChatGenerics> = useMemo(
    () => ({
      appSettings,
      channel,
      client,
      connectionRecovering,
      enableOfflineSupport,
      ImageComponent,
      isOnline,
      mutedUsers,
      setActiveChannel,
    }),
    [channelId, clientValues, connectionRecovering, isOnline, mutedUsersLength],
  );

  return chatContext;
};
