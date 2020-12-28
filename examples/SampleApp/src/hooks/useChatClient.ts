import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import { USER_TOKENS, USERS } from '../ChatUsers';
import {
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType,
  LoginConfig,
} from '../types';
import AsyncStore from '../utils/AsyncStore';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

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

  const loginUser = async (config: LoginConfig) => {
    const client = new StreamChat<
      LocalAttachmentType,
      LocalChannelType,
      LocalCommandType,
      LocalEventType,
      LocalMessageType,
      LocalResponseType,
      LocalUserType
    >(config.apiKey, {
      timeout: 6000,
    });
    const randomSeed = getRandomInt(1, 50);
    const user = {
      id: config.userId,
      image:
        config.userImage ||
        `https://randomuser.me/api/portraits/thumb/men/${randomSeed}.jpg`,
      name: config.userName,
    };

    await client.connectUser(user, config.userToken);

    await AsyncStore.setItem('@stream-rn-sampleapp-login-config', config);

    setChatClient(client);
  };

  const switchUser = async (userId?: string) => {
    setIsConnecting(true);
    try {
      const id = userId;

      if (id) {
        await loginUser({
          apiKey: 'q95x9hkbyd6p',
          userId: USERS[id].id,
          userImage: USERS[id].image,
          userName: USERS[id].name || '',
          userToken: USER_TOKENS[id],
        });
      } else {
        const config = await AsyncStore.getItem<LoginConfig | null>(
          '@stream-rn-sampleapp-login-config',
          null,
        );
        console.log('existing config - ', config);

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
