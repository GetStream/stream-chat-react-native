import { LoginConfig } from '../types';
import AsyncStore from './AsyncStore';
import {
  FirebaseMessagingTypes,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import { DeliveredMessageConfirmation, StreamChat } from 'stream-chat';
import notifee from '@notifee/react-native';
import { getMessaging } from '@react-native-firebase/messaging';

const messaging = getMessaging();

const displayNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  channelId: string,
) => {
  const { stream, ...rest } = remoteMessage.data ?? {};
  const data = {
    ...rest,
    ...((stream as unknown as Record<string, string> | undefined) ?? {}), // extract and merge stream object if present
  };
  if (data.body && data.title) {
    await notifee.displayNotification({
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
      body: data.body as string,
      title: data.title as string,
      data,
    });
  }
};

setBackgroundMessageHandler(messaging, async (remoteMessage) => {
  try {
    const loginConfig = await AsyncStore.getItem<LoginConfig>(
      '@stream-rn-sampleapp-login-config',
      null,
    );
    if (!loginConfig) {
      return;
    }
    const chatClient = StreamChat.getInstance(loginConfig.apiKey);
    await chatClient._setToken({ id: loginConfig.userId }, loginConfig.userToken);

    const notification = remoteMessage.data;

    const deliverMessageConfirmation = [
      {
        cid: notification?.cid,
        id: notification?.id,
      },
    ];

    await chatClient?.markChannelsDelivered({
      latest_delivered_messages: deliverMessageConfirmation as DeliveredMessageConfirmation[],
    });
    // create the android channel to send the notification to
    const channelId = await notifee.createChannel({
      id: 'chat-messages',
      name: 'Chat Messages',
    });
    // display the notification
    await displayNotification(remoteMessage, channelId);
  } catch (error) {
    console.error(error);
  }
});
