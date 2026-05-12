import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { isNotificationForTarget, type NotificationTarget } from '../notificationTarget';

export type UseNotificationsFilter = (notification: Notification) => boolean;

export type UseNotificationsOptions = {
  /** Additional filter applied after optional target filtering. */
  filter?: UseNotificationsFilter;
  /** When true, returns an empty list unless an exact target is provided. */
  requireTarget?: boolean;
  /** Exact target used to select notifications for one host. */
  target?: NotificationTarget;
};

/** Subscribes to the client notification store and returns matching non-system notifications. */
export const useNotifications = (options?: UseNotificationsOptions): Notification[] => {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const notifications = state.notifications;
      const target = options?.target;
      const byTarget = target
        ? notifications.filter((notification) => isNotificationForTarget(notification, target))
        : options?.requireTarget
          ? []
          : notifications;

      return {
        notifications: options?.filter ? byTarget.filter(options.filter) : byTarget,
      };
    },
    [options?.filter, options?.requireTarget, options?.target],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
