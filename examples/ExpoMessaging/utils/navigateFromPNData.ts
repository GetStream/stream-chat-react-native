import { router } from 'expo-router';
import { MessagingDataType } from '../hooks/usePushNotifications';

export const navigateFromPNData = (data: MessagingDataType) => {
  if (!data) return;

  const channelId = data.channel_id;
  if (channelId) {
    router.push(`/channel/${channelId}?push_notification=true`);
  }
};
