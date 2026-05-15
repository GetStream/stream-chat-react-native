import { Notification } from 'stream-chat';

import { useStableCallback } from './useStableCallback';
import { useStateStore } from './useStateStore';

import type { InAppNotificationsState } from '../state-store/in-app-notifications-store';
import {
  closeInAppNotification,
  inAppNotificationsStore,
  openInAppNotification,
} from '../state-store/in-app-notifications-store';

const selector = ({ notifications }: InAppNotificationsState) => ({
  notifications,
});

/**
 * @deprecated Prefer the client-backed notification APIs exported from
 * `components/Notifications` (`useNotificationApi`, `useNotifications`, and
 * `NotificationList`). This hook is kept for apps that already render their own
 * legacy in-app notification store.
 */
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
