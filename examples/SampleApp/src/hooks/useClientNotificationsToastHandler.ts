import type { Notification } from 'stream-chat';
import { useClientNotifications } from 'stream-chat-react-native';

import { useEffect, useMemo, useRef } from 'react';
import { useToastState } from './useToastState';

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

  useEffect(() => {
    prevNotifications.current = notifications;
  }, [notifications]);

  return difference;
};

/**
 * This hook is used to open and close the toast notifications when the notifications are added or removed.
 * @returns {void}
 */
export const useClientNotificationsToastHandler = () => {
  const { notifications } = useClientNotifications();
  const { openToast, closeToast } = useToastState();
  const { added, removed } = usePreviousNotifications(notifications);

  useEffect(() => {
    added.forEach(openToast);
    removed.forEach((notification) => closeToast(notification.id));
  }, [added, closeToast, openToast, removed]);
};
