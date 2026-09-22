import { useMemo } from 'react';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';

export const useCreateChatContext = ({
  appSettings,
  channel,
  client,
  enableOfflineSupport,
  isMessageAIGenerated,
  mutedUsers,
  setActiveChannel,
}: ChatContextValue) => {
  const channelId = channel?.id;
  const clientValues = client
    ? `${client.clientID}${Object.keys(client.activeChannels).length}${
        Object.keys(client.listeners).length
      }${client.mutedChannels.length}`
    : 'Offline';
  const mutedUsersLength = mutedUsers.length;

  const chatContext: ChatContextValue = useMemo(
    () => ({
      appSettings,
      channel,
      client,
      enableOfflineSupport,
      isMessageAIGenerated,
      mutedUsers,
      setActiveChannel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appSettings, channelId, clientValues, mutedUsersLength],
  );

  return chatContext;
};
