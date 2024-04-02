import { useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';
import messaging from '@react-native-firebase/messaging';
import { QuickSqliteClient } from 'stream-chat-react-native';
import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig, StreamChatGenerics } from '../types';

const PUSH_PROVIDER = 'firebase';
const PUSH_PROVIDER_NAME = 'rn-fcm';

// Request Push Notification permission from device.
const requestNotificationPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const isEnabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  console.log('Notification Permission Status', { authStatus, isEnabled });
};

// note: empty backgroundMessageHandler to avoid warning that no handler is set
messaging().setBackgroundMessageHandler(async (_remoteMessage) => {});

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<StreamChat<StreamChatGenerics> | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>();

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
    setChatClient(client);

    const user = {
      id: config.userId,
      image: config.userImage,
      name: config.userName,
    };

    // Register FCM token with stream chat server.
    const token = await messaging().getToken();

    client.setLocalDevice({
      id: token,
      push_provider: PUSH_PROVIDER,
      push_provider_name: PUSH_PROVIDER_NAME,
    });

    const connectedUser = await client.connectUser(user, config.userToken);
    const initialUnreadCount = connectedUser?.me?.total_unread_count;
    setUnreadCount(initialUnreadCount);
    await AsyncStore.setItem('@stream-rn-sampleapp-login-config', config);

    // Listen to new FCM tokens and register them with stream chat server.
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      if (newToken === token) {
        return;
      }
      await client.addDevice(newToken, PUSH_PROVIDER, user.id, PUSH_PROVIDER_NAME);
    });

    unsubscribePushListenersRef.current = () => {
      unsubscribeTokenRefresh();
    };
  };

  const switchUser = async (userId: string) => {
    setIsConnecting(true);
    try {
      await loginUser({
        apiKey: 'yjrt5yxw77ev',
        userId: USERS[userId].id,
        userImage: USERS[userId].image,
        userName: USERS[userId].name,
        userToken: USER_TOKENS[userId],
      });
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

  /**
   * On mount,
   * 1. request notification permission
   * 2. login user if a previous login config exists
   */
  useEffect(() => {
    const run = async () => {
      await requestNotificationPermission();
      const prevLoginConfig = await AsyncStore.getItem<LoginConfig | null>(
        '@stream-rn-sampleapp-login-config',
        null,
      );
      if (prevLoginConfig) {
        try {
          await loginUser(prevLoginConfig);
        } catch (e) {
          console.warn(e);
        }
      }
    };
    run();
    return () => {
      unsubscribePushListenersRef.current?.();
      // note: disconnect user on unmount for cleanup in hot reload scenarios
      chatClient?.disconnectUser();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Listen to changes in unread counts and update the badge count
   */
  useEffect(() => {
    const listener = chatClient?.on((e) => {
      if (e.total_unread_count !== undefined) {
        setUnreadCount(e.total_unread_count);
      } else {
        const countUnread = Object.values(chatClient.activeChannels).reduce(
          (count, channel) => count + channel.countUnread(),
          0,
        );
        setUnreadCount(countUnread);
      }
    });

    return () => {
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [chatClient]);

  return {
    chatClient,
    isConnecting,
    loginUser,
    logout,
    switchUser,
    unreadCount,
  };
};
