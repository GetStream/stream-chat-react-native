import { Notification } from 'stream-chat';

import { useStableCallback } from './useStableCallback';
import { useStateStore } from './useStateStore';

import type { InAppNotificationsState } from '../store/in-app-notifications-store';
import {
  closeInAppNotification,
  inAppNotificationsStore,
  openInAppNotification,
} from '../store/in-app-notifications-store';

const selector = ({ notifications }: InAppNotificationsState) => ({
  notifications,
});

export const useInAppNotificationsState = () => {
  const { notifications } = useStateStore(inAppNotificationsStore, selector);

  const openInAppNotificationInternal = useStableCallback((notificationData: Notification) => {
    openInAppNotification(notificationData);
  });

  const closeInAppNotificationInternal = useStableCallback((id: string) => {
    closeInAppNotification(id);
  });

  return {
    closeInAppNotification: closeInAppNotificationInternal,
    notifications,
    openInAppNotification: openInAppNotificationInternal,
  };
};
