import { useEffect, useRef, useState } from 'react';
import { getMessaging, AuthorizationStatus } from '@react-native-firebase/messaging';
import { USER_TOKENS, USERS } from '../ChatUsers';
import AsyncStore from '../utils/AsyncStore';

import type { LoginConfig } from '../types';
import { PermissionsAndroid, Platform } from 'react-native';

const messaging = getMessaging();

// Request Push Notification permission from device.
const requestNotificationPermission = async () => {
  const authStatus = await messaging.requestPermission();
  const isEnabled =
    authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
  console.log('Permission Status', { authStatus, isEnabled });
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

    const permissionAuthStatus = await messaging.hasPermission();
    let isEnabled =
      permissionAuthStatus === AuthorizationStatus.AUTHORIZED ||
      permissionAuthStatus === AuthorizationStatus.PROVISIONAL;

    if (permissionAuthStatus === AuthorizationStatus.DENIED) {
      isEnabled = await requestAndroidPermission();
    }

    if (isEnabled) {
      // Register FCM token with stream chat server.
      // await messaging.set;
      const apnsToken = await messaging.getAPNSToken();
      const firebaseToken = await messaging.getToken();
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
      const token = id === 'firebase' ? firebaseToken : (apnsToken ?? firebaseToken);

      // Listen to new FCM tokens and register them with stream chat server.
      const unsubscribeTokenRefresh = messaging.onTokenRefresh(async (newFirebaseToken) => {
        const newApnsToken = await messaging.getAPNSToken();
        const newToken = id === 'firebase' ? newFirebaseToken : (newApnsToken ?? firebaseToken);
      });
      // show notifications when on foreground
      const unsubscribeForegroundMessageReceive = messaging.onMessage(async (remoteMessage) => {
        const { stream, ...rest } = remoteMessage.data ?? {};
        const data = {
          ...rest,
          ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
        };
        // create the android channel to send the notification to
        // display the notification on foreground
        const notification = remoteMessage.notification ?? {};
        const body = (data.body ?? notification.body) as string;
        const title = (data.title ?? notification.title) as string;

      });

      unsubscribePushListenersRef.current = () => {
        unsubscribeTokenRefresh();
        unsubscribeForegroundMessageReceive();
      };
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
