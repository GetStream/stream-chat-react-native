import { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import messaging from '@react-native-firebase/messaging';
import { Alert, Linking } from 'react-native';
import notifee from '@notifee/react-native';

import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig, StreamChatGenerics } from '../types';

// Request Push Notification permission from device.
const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
  } else {
    // Go to app settings page, if the permissions were denied
    Alert.alert(
      'Notification Permission',
      'Please provide notifications permission through Settings',
      [
        {
          onPress: () => console.log('Push notifications ignored'),
          style: 'cancel',
          text: 'Cancel',
        },
        { onPress: () => Linking.openSettings(), text: 'OK' },
      ],
    );
  }
};

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
    });

    const user = {
      id: config.userId,
      image: config.userImage,
      name: config.userName,
    };

    // const user = {
    //   id: 'santhosh',
    //   image: config.userImage,
    //   name: 'santhosh',
    // };

    // config.apiKey = 'xc75gj2eaw9j';
    // config.userToken =
    //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FudGhvc2gifQ.f-6Bj3nYJ1XA5kEbKTs8B0WDcLl1VfsUqqhYAQnMfdI';
    // config.userId = 'santhosh';

    await client.connectUser(user, config.userToken);
    await AsyncStore.setItem('@stream-rn-sampleapp-login-config', config);

    // Register FCM token with stream chat server.
    const token = await messaging().getToken();
    await client.addDevice(token, 'firebase');

    // Listen to new FCM tokens and register them with stream chat server.
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      await client.addDevice(newToken, 'firebase');
    });
    // show notifications when on foreground
    const unsubscribeForegroundMessageReceive = messaging().onMessage(async (remoteMessage) => {
      const fcmId = remoteMessage.data?.id;
      if (!fcmId) return;
      const message = await client.getMessage(fcmId);
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
      });

      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;

      await notifee.displayNotification({
        android: {
          channelId,
        },
        body: message.message.text,
        title: message.message.user?.name,
      });
    });

    unsubscribePushListenersRef.current = () => {
      unsubscribeTokenRefresh();
      unsubscribeForegroundMessageReceive();
    };

    setChatClient(client);
  };

  const switchUser = async (userId?: string) => {
    setIsConnecting(true);

    try {
      if (userId) {
        await loginUser({
          apiKey: 'yjrt5yxw77ev',
          // apiKey: 'xc75gj2eaw9j',
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
          // config.apiKey = 'xc75gj2eaw9j';
          // config.userToken =
          //   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoic2FudGhvc2gifQ.f-6Bj3nYJ1XA5kEbKTs8B0WDcLl1VfsUqqhYAQnMfdI';
          // config.userId = 'santhosh';
          await loginUser(config);
        }
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
    requestNotificationPermission();
    switchUser();
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
