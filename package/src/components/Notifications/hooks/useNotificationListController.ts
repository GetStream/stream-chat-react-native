import { useEffect } from 'react';

import type { Notification as NotificationType } from 'stream-chat';

import { hasSystemNotificationTag, useNotificationApi } from './useNotificationApi';
import { useNotifications, type UseNotificationsFilter } from './useNotifications';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useLazyRef } from '../../../hooks/useLazyRef';
import { useStableCallback } from '../../../hooks/useStableCallback';
import {
  claimNotificationTargetIfNeeded,
  isNotificationForTarget,
  pruneNotificationTargetClaims,
  registerActiveNotificationTarget,
  type NotificationTargetPanel,
} from '../notificationTarget';
import { useResolvedNotificationTarget } from '../NotificationTargetContext';

export type UseNotificationListControllerParams = {
  filter?: UseNotificationsFilter;
  hostId?: string;
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
  filter,
  hostId,
  panel,
}: UseNotificationListControllerParams = {}): UseNotificationListControllerResult => {
  const { client } = useChatContext();
  const { removeNotification, startNotificationTimeout } = useNotificationApi();
  const target = useResolvedNotificationTarget({ hostId, panel });
  const startedTimeoutIdsRef = useLazyRef<Set<string>>(() => new Set());

  const combinedFilter = useStableCallback((notification: NotificationType) => {
    if (hasSystemNotificationTag(notification)) return false;
    return filter ? filter(notification) : true;
  });

  const notifications = useNotifications({
    filter: combinedFilter,
    requireTarget: true,
    target,
  });
  const notification = getActiveNotification(notifications);

  const dismissNotification = useStableCallback(() => {
    if (!notification) return;

    startedTimeoutIdsRef.current.delete(notification.id);
    removeNotification(notification.id);
  });

  const removeCurrentPanelNotifications = useStableCallback(() => {
    if (!target) return;

    startedTimeoutIdsRef.current.clear();
    client.notifications.notifications
      .filter(
        (notification) =>
          !hasSystemNotificationTag(notification) &&
          isNotificationForTarget(notification, target, {
            claimOwner: client.notifications,
          }),
      )
      .forEach(({ id }) => removeNotification(id));
  });

  useEffect(() => {
    return client.notifications.store.addPreprocessor((nextState, previousState) => {
      const notificationIds = new Set(nextState.notifications.map(({ id }) => id));
      const previousNotificationIds = new Set(
        previousState?.notifications.map(({ id }) => id) ?? [],
      );

      pruneNotificationTargetClaims(client.notifications, notificationIds);
      nextState.notifications.forEach((notification) => {
        if (previousNotificationIds.has(notification.id)) return;
        if (hasSystemNotificationTag(notification)) return;

        claimNotificationTargetIfNeeded(client.notifications, notification);
      });
    });
  }, [client.notifications]);

  useEffect(() => {
    if (!target) return;

    return registerActiveNotificationTarget(client.notifications, target);
  }, [client.notifications, target]);

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

  useEffect(() => {
    return () => {
      removeCurrentPanelNotifications();
    };
  }, [removeCurrentPanelNotifications]);

  return {
    dismissNotification,
    notification,
  };
};
