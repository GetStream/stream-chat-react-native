import type { Notification } from 'stream-chat';
import { useClientNotifications, useInAppNotificationsState } from 'stream-chat-react-native';

import { useEffect, useMemo, useRef } from 'react';

export const usePreviousNotifications = (notifications: Notification[]) => {
  const prevNotifications = useRef<Notification[]>(notifications);

  const difference = useMemo(() => {
    const prevIds = new Set(prevNotifications.current.map((notification) => notification.id));
    const newIds = new Set(notifications.map((notification) => notification.id));
    return {
      added: notifications.filter((notification) => !prevIds.has(notification.id)),
      removed: prevNotifications.current.filter((notification) => !newIds.has(notification.id)),
    };
  }, [notifications]);

  prevNotifications.current = notifications;

  return difference;
};

/**
 * This hook is used to open and close the toast notifications when the notifications are added or removed.
 * @returns {void}
 */
export const useClientNotificationsToastHandler = () => {
  const { notifications } = useClientNotifications();
  const { openInAppNotification, closeInAppNotification } = useInAppNotificationsState();
  const { added, removed } = usePreviousNotifications(notifications);

  useEffect(() => {
    added.forEach(openInAppNotification);
    removed.forEach((notification) => closeInAppNotification(notification.id));
  }, [added, closeInAppNotification, openInAppNotification, removed]);
};
