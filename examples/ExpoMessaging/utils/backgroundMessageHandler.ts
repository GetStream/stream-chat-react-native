import {
  FirebaseMessagingTypes,
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

const messaging = getMessaging();

export const extractNotificationConfig = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  const { stream, ...rest } = remoteMessage.data ?? {};
  const data = {
    ...rest,
    ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
  };
  const notification = remoteMessage.notification ?? {};
  const body = (data.body ?? notification.body ?? '') as string;
  const title = (data.title ?? notification.title) as string;

  return { data, body, title };
};

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default',
    importance: AndroidImportance.HIGH,
  });
  const { data, body, title } = extractNotificationConfig(remoteMessage);
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: 'default',
      color: '#2063F6',
      pressAction: {
        id: 'default',
      },
    },
  });
});
