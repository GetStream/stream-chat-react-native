import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig, StreamChatGenerics } from '../types';

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<StreamChatGenerics> | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const loginUser = async () => {

    const client = StreamChat.getInstance<StreamChatGenerics>(config.apiKey, {
      timeout: 6000,
    });
    console.log('Here in login user function')
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

        await loginUser(config);
      }
    } catch (e) {
      console.warn(e);
    }
    setIsConnecting(false);
  };

  const logout = async () => {
    setChatClient(null);
    chatClient?.disconnectUser();
    await AsyncStore.removeItem('@stream-rn-sampleapp-login-config');
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
