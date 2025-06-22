import { useEffect, useRef, useState } from 'react';
import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig } from '../types';
import { PermissionsAndroid, Platform } from 'react-native';

// Request Push Notification permission from device.
const requestNotificationPermission = async () => {
  console.log('Permission Status', { authStatus: 'authorized', isEnabled: true });
};

const requestAndroidPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const useChatClient = () => {
  const [chatClient, setChatClient] = useState<null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const unsubscribePushListenersRef = useRef<() => void>(undefined);

  /**
   * @param config the user login config
   * @returns function to unsubscribe from listeners
   */
  const loginUser = async (config: LoginConfig) => {
    // unsubscribe from previous push listeners
    unsubscribePushListenersRef.current?.();

    const isEnabled = true;

    if (isEnabled) {
      // Register FCM token with stream chat server.
      // await messaging.set;
      const provider = await AsyncStore.getItem('@stream-rn-sampleapp-push-provider', {
        id: 'firebase',
        name: 'rn-fcm',
      });
      const providerNameOverride = await AsyncStore.getItem<string>(
        `@stream-rn-sampleapp-push-provider-${provider?.id}-override`,
        null,
      );
      const id = provider?.id ?? 'firebase';
      const name =
        providerNameOverride && providerNameOverride?.length > 0
          ? providerNameOverride
          : (provider?.name ?? 'rn-fcm');
      const token = 'fir-token';

      // Listen to new FCM tokens and register them with stream chat server.
      // show notifications when on foreground
    }
  };

  const switchUser = async (userId?: string) => {

    setIsConnecting(true);

    try {
      if (userId) {
      } else {
      }
    } catch (e) {
      console.warn(e);
    }
    setIsConnecting(false);
  };

  const logout = async () => {
    setChatClient(null);
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
