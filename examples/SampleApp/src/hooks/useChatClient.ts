import { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { QuickSqliteClient } from 'stream-chat-react-native';
import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig, StreamChatGenerics } from '../types';

// Request Push Notification permission from device.
const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const isEnabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  console.log('Permission Status', { authStatus, isEnabled });
};

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const messageId = remoteMessage.data?.id;
  if (!messageId) return;
  const config = await AsyncStore.getItem<LoginConfig | null>(
    '@stream-rn-sampleapp-login-config',
    null,
  );
  if (!config) return;

  const client = StreamChat.getInstance(config.apiKey);

  const user = {
    id: config.userId,
    image: config.userImage,
    name: config.userName,
  };

  // eslint-disable-next-line no-underscore-dangle
  await client._setToken(user, config.userToken);
  const message = await client.getMessage(messageId);

  // create the android channel to send the notification to
  const channelId = await notifee.createChannel({
    id: 'chat-messages',
    name: 'Chat Messages',
  });

  if (message.message.user?.name && message.message.text) {
    const { stream, ...rest } = remoteMessage.data ?? {};
    const data = {
      ...rest,
      ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
    };
    await notifee.displayNotification({
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
      body: message.message.text,
      data,
      title: 'New message from ' + message.message.user.name,
    });
  }
});

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<StreamChatGenerics> | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const unsubscribePushListenersRef = useRef<() => void>();

  /**
   * @param config the user login config
   * @returns function to unsubscribe from listeners
   */
  const loginUser = async (config: LoginConfig) => {
    // unsubscribe from previous push listeners
    unsubscribePushListenersRef.current?.();
    const client = StreamChat.getInstance<StreamChatGenerics>(config.apiKey, {
      timeout: 6000,
      // logger: (type, msg) => console.log(type, msg)
    });

    const user = {
      id: config.userId,
      image: config.userImage,
      name: config.userName,
    };
    const promise = client.connectUser(user, config.userToken);
    setChatClient(client);
    await promise;
    await AsyncStore.setItem('@stream-rn-sampleapp-login-config', config);

    const permissionAuthStatus = await messaging().hasPermission();
    const isEnabled =
      permissionAuthStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      permissionAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (isEnabled) {
      // Register FCM token with stream chat server.
      const token = await messaging().getToken();
      await client.addDevice(token, 'firebase');

      // Listen to new FCM tokens and register them with stream chat server.
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
        await client.addDevice(newToken, 'firebase');
      });
      // show notifications when on foreground
      const unsubscribeForegroundMessageReceive = messaging().onMessage(async (remoteMessage) => {
        const messageId = remoteMessage.data?.id;
        if (!messageId) return;
        const message = await client.getMessage(messageId);
        if (message.message.user?.name && message.message.text) {
          // create the android channel to send the notification to
          const channelId = await notifee.createChannel({
            id: 'foreground',
            name: 'Foreground Messages',
          });
          // display the notification on foreground
          const { stream, ...rest } = remoteMessage.data ?? {};
          const data = {
            ...rest,
            ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
          };
          await notifee.displayNotification({
            android: {
              channelId,
              pressAction: {
                id: 'default',
              },
            },
            body: message.message.text,
            data,
            title: 'New message from ' + message.message.user.name,
          });
        }
      });

      unsubscribePushListenersRef.current = () => {
        unsubscribeTokenRefresh();
        unsubscribeForegroundMessageReceive();
      };
    }
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

  const logout = async () => {
    QuickSqliteClient.resetDB();
    setChatClient(null);
    chatClient?.disconnectUser();
    await AsyncStore.removeItem('@stream-rn-sampleapp-login-config');
  };

  useEffect(() => {
    const run = async () => {
      await requestNotificationPermission();
      await switchUser();
    };
    run();
    return unsubscribePushListenersRef.current;
  }, []);

  return {
    chatClient,
    isConnecting,
    loginUser,
    logout,
    switchUser,
  };
};
