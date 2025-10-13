import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessaging,
  AuthorizationStatus,
  getInitialNotification as firebaseGetInitialNotification,
  hasPermission,
  getToken,
  onTokenRefresh,
  requestPermission,
  onMessage,
  FirebaseMessagingTypes,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { PushProvider, StreamChat } from 'stream-chat';
import notifee, { EventType } from '@notifee/react-native';
import { navigateFromPNData } from '@/utils/navigateFromPNData';

export type MessagingDataType = FirebaseMessagingTypes.RemoteMessage['data'];

const messaging = getMessaging();

notifee.onBackgroundEvent(async ({ detail, type }) => {
  if (type === EventType.PRESS) {
    // user press on notification detected while app was on background on Android
    navigateFromPNData(detail.notification?.data as MessagingDataType);
    await Promise.resolve();
  }
});

const requestAndroidPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

const requestNotificationPermission = async () => {
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    console.log('Authorization status:', authStatus);
  }
};

const getInitialNotification = async () => {
  if (Platform.OS === 'ios') {
    const initialNotification = await firebaseGetInitialNotification(messaging);
    if (initialNotification) {
      const data = initialNotification.data as MessagingDataType;
      if (data) {
        navigateFromPNData(data);
      }
    }
  } else {
    const initialNotification = await notifee.getInitialNotification();
    if (initialNotification) {
      const data = initialNotification.notification.data as MessagingDataType;
      if (data) {
        navigateFromPNData(data);
      }
    }
  }
};

/**
 * Hook to register push notifications for the chat client.
 * @param chatClient - The chat client to register push notifications for.
 */
export const usePushNotifications = ({ chatClient }: { chatClient: StreamChat | null }) => {
  const unsubscribePushListenerRef = useRef<() => void>(undefined);
  const registerPushToken = useCallback(async () => {
    try {
      if (!chatClient) {
        return;
      }

      const permissionStatus = await hasPermission(messaging);
      let isEnabled =
        permissionStatus === AuthorizationStatus.AUTHORIZED ||
        permissionStatus === AuthorizationStatus.PROVISIONAL;

      if (permissionStatus === AuthorizationStatus.DENIED) {
        isEnabled = await requestAndroidPermission();
      }

      if (!isEnabled) {
        return;
      }

      const token = await getToken(messaging);
      const push_provider = 'firebase';
      const push_provider_name = 'rn-expo-app'; // name an alias for your push provider (optional)

      await chatClient.addDevice(
        token,
        push_provider as PushProvider,
        chatClient.userID,
        push_provider_name,
      );

      const removeOldToken = async () => {
        const oldToken = await AsyncStorage.getItem('@current_push_token');
        if (oldToken !== null) {
          await chatClient.removeDevice(oldToken);
        }
      };

      const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (newToken) => {
        await removeOldToken();
        chatClient.addDevice(newToken, push_provider, chatClient.userID, push_provider_name);
        AsyncStorage.setItem('@current_push_token', newToken);
      });

      // Shows notifications on foreground
      const unsubscribeForegroundMessageReceive = onMessage(messaging, async (remoteMessage) => {
        const { stream, ...rest } = remoteMessage.data ?? {};
        const data = {
          ...rest,
          ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
        };
        const channelId = await notifee.createChannel({
          id: 'foreground',
          name: 'Foreground Messages',
        });

        // create the android channel to send the notification to
        // display the notification on foreground
        const notification = remoteMessage.notification ?? {};
        const body = (data.body ?? notification.body) as string;
        const title = (data.title ?? notification.title) as string;

        if (body && title) {
          await notifee.displayNotification({
            android: {
              channelId,
              pressAction: {
                id: 'default',
              },
            },
            body,
            title,
            data,
          });
        }
      });

      // When the banner is tapped while app is in background
      const unsubscribeOnNotificationOpen = onNotificationOpenedApp(messaging, (remoteMessage) => {
        navigateFromPNData(remoteMessage.data as MessagingDataType);
      });

      getInitialNotification();

      // When the banner is tapped while app is in foreground
      const unsubscribeNotifee = notifee.onForegroundEvent(({ detail, type }) => {
        if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
          navigateFromPNData(detail.notification?.data as MessagingDataType);
        }
      });

      unsubscribePushListenerRef.current = () => {
        unsubscribeTokenRefresh();
        unsubscribeForegroundMessageReceive();
        unsubscribeOnNotificationOpen();
        unsubscribeNotifee();
      };
    } catch (error) {
      console.error(error);
    }
  }, [chatClient]);

  useEffect(() => {
    const init = async () => {
      await requestNotificationPermission();
      await registerPushToken();
    };

    if (chatClient) {
      init();
    }

    return unsubscribePushListenerRef.current;
  }, [chatClient]);
};
