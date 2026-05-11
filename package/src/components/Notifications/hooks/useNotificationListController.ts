import { useCallback, useEffect } from 'react';

import type { Notification as NotificationType } from 'stream-chat';

import { hasSystemNotificationTag, useNotificationApi } from './useNotificationApi';
import { useNotifications, type UseNotificationsFilter } from './useNotifications';

import { useLazyRef } from '../../../hooks/useLazyRef';
import type { NotificationTargetPanel } from '../notificationTarget';

export type UseNotificationListControllerParams = {
  fallbackPanel?: NotificationTargetPanel;
  filter?: UseNotificationsFilter;
  panel?: NotificationTargetPanel;
};

export type UseNotificationListControllerResult = {
  dismissNotification: () => void;
  notification: NotificationType | null;
};

const ACTION_NOTIFICATION_DURATION = 5000;

const getNewestNotification = (notifications: NotificationType[]) =>
  notifications.reduce<NotificationType | null>(
    (newest, notification) =>
      !newest || notification.createdAt >= newest.createdAt ? notification : newest,
    null,
  );

const isPersistentNotification = (notification: NotificationType) => !notification.duration;

const getActiveNotification = (notifications: NotificationType[]) => {
  const persistentNotifications = notifications.filter(isPersistentNotification);
  return getNewestNotification(
    persistentNotifications.length > 0 ? persistentNotifications : notifications,
  );
};

const getNotificationDurationOverride = (notification: NotificationType) => {
  if (isPersistentNotification(notification)) return undefined;
  if (!notification.actions?.length) return undefined;

  return Math.max(notification.duration ?? 0, ACTION_NOTIFICATION_DURATION);
};

export const useNotificationListController = ({
  fallbackPanel,
  filter,
  panel,
}: UseNotificationListControllerParams = {}): UseNotificationListControllerResult => {
  const { removeNotification, startNotificationTimeout } = useNotificationApi();
  const startedTimeoutIdsRef = useLazyRef<Set<string>>(() => new Set());

  const combinedFilter = useCallback(
    (notification: NotificationType) => {
      if (hasSystemNotificationTag(notification)) return false;
      return filter ? filter(notification) : true;
    },
    [filter],
  );

  const notifications = useNotifications({
    fallbackPanel,
    filter: combinedFilter,
    panel,
  });
  const notification = getActiveNotification(notifications);

  const dismissNotification = useCallback(() => {
    if (!notification) return;

    startedTimeoutIdsRef.current.delete(notification.id);
    removeNotification(notification.id);
  }, [notification, removeNotification, startedTimeoutIdsRef]);

  useEffect(() => {
    const notificationIds = new Set(notifications.map(({ id }) => id));
    startedTimeoutIdsRef.current.forEach((id) => {
      if (!notificationIds.has(id)) {
        startedTimeoutIdsRef.current.delete(id);
      }
    });
  }, [notifications, startedTimeoutIdsRef]);

  useEffect(() => {
    if (!notification || notifications.length <= 1) return;

    notifications.forEach(({ id }) => {
      if (id === notification.id) return;

      startedTimeoutIdsRef.current.delete(id);
      removeNotification(id);
    });
  }, [notification, notifications, removeNotification, startedTimeoutIdsRef]);

  useEffect(() => {
    if (!notification) return;
    if (startedTimeoutIdsRef.current.has(notification.id)) return;

    startedTimeoutIdsRef.current.add(notification.id);
    const durationOverride = getNotificationDurationOverride(notification);
    if (typeof durationOverride === 'number') {
      startNotificationTimeout(notification.id, durationOverride);
    } else {
      startNotificationTimeout(notification.id);
    }
  }, [notification, startNotificationTimeout, startedTimeoutIdsRef]);

  return {
    dismissNotification,
    notification,
  };
};
