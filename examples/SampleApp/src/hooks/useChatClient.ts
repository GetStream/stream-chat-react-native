import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalReactionType,
  LocalUserType,
  LoginConfig,
} from '../types';

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min)) + min;

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<
    LocalAttachmentType,
    LocalChannelType,
    LocalCommandType,
    LocalEventType,
    LocalMessageType,
    LocalReactionType,
    LocalUserType
  > | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const loginUser = async (config: LoginConfig) => {
    const client = StreamChat.getInstance<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalReactionType,
      LocalUserType
    >(config.apiKey, {
      timeout: 6000,
    });
    const randomSeed = getRandomInt(1, 50);
    const user = {
      id: config.userId,
      image: config.userImage,
      name: config.userName,
    };

    await client.connectUser(user, config.userToken);

    await AsyncStore.setItem('@stream-rn-sampleapp-login-config', config);

    setChatClient(client);
  };

  const switchUser = async (userId?: string) => {
    setIsConnecting(true);

    try {
      if (userId) {
        await loginUser({
          apiKey: 'yjrt5yxw77ev',
          userId: USERS[userId].id,
          userImage: USERS[userId].image,
          userName: USERS[userId].name,
          userToken: USER_TOKENS[userId],
        });
      } else {
        const config = await AsyncStore.getItem<LoginConfig | null>(
          '@stream-rn-sampleapp-login-config',
          null,
        );

        if (config) {
          await loginUser(config);
        }
      }
    } catch (e) {
      console.warn(e);
    }

    setIsConnecting(false);
  };

  const logout = () => {
    setChatClient(null);
    chatClient?.disconnect();
    AsyncStore.removeItem('@stream-rn-sampleapp-login-config');
  };

  useEffect(() => {
    switchUser();
  }, []);

  return {
    chatClient,
    isConnecting,
    loginUser,
    logout,
    switchUser,
  };
};
