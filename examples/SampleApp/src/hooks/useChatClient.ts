import React, { useEffect, useState } from 'react';

import { Channel as ChannelType, StreamChat } from 'stream-chat';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
} from '../types';
import AsyncStore from '../utils/AsyncStore';
import { USER_TOKENS, USERS } from '../ChatUsers';
export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalResponseType,
    LocalUserType
  > | null>(null);

  const [isConnecting, setIsConnecting] = useState(true);
  const switchUser = async (userId?: string) => {
    setIsConnecting(true);
    try {
      let id = userId;
      if (!id) {
        id = await AsyncStore.getItem('@stream-rn-sampleapp-user-id', false);
      }

      if (id) {
        const user = USERS[id];
        const userToken = USER_TOKENS[id];
        const client = new StreamChat<
          LocalAttachmentType,
          LocalChannelType,
          LocalCommandType,
          LocalEventType,
          LocalMessageType,
          LocalResponseType,
          LocalUserType
        >('q95x9hkbyd6p', {
          timeout: 6000,
        });

        await client.setUser(user, userToken);
        await AsyncStore.setItem('@stream-rn-sampleapp-user-id', id);

        setChatClient(client);
      }
    } catch (e) {
      console.warn(e);
    }
    setIsConnecting(false);
  };

  useEffect(() => {
    switchUser();
  }, []);

  return {
    chatClient,
    isConnecting,
    switchUser,
  };
};
