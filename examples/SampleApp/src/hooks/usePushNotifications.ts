import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { StreamChat } from 'stream-chat';
import type { StreamChatGenerics } from '../types';

// Request Push Notification permission from device.
const requestPermission = async () => {
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

export const usePushNotifications = (
  chatClient: StreamChat<StreamChatGenerics> | null,
  isConnecting: boolean,
) => {
  useEffect(() => {
    requestPermission();
  }, []);

  // set up firebase push notifications
  useEffect(() => {
    if (chatClient && !isConnecting) {
      const registerPushToken = async () => {
        // Register FCM token with stream chat server.
        const token = await messaging().getToken();
        await chatClient.addDevice(token, 'firebase');

        // Listen to new FCM tokens and register them with stream chat server.
        return messaging().onTokenRefresh(async (newToken) => {
          await chatClient.addDevice(newToken, 'firebase');
        });
      };
      registerPushToken();
    }
  }, [chatClient, isConnecting]);
};
