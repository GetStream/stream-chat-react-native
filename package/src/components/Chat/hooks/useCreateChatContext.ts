import { useMemo } from 'react';

import type { ChatContextValue } from '../../../contexts/chatContext/ChatContext';

export const useCreateChatContext = ({
  client,
  getAppSettings,
  isMessageAIGenerated,
}: ChatContextValue) =>
  useMemo<ChatContextValue>(
    () => ({ client, getAppSettings, isMessageAIGenerated }),
    [client, getAppSettings, isMessageAIGenerated],
  );
