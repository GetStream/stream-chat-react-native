import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { isNotificationForTarget, type NotificationTarget } from '../notificationTarget';

export type UseNotificationsFilter = (notification: Notification) => boolean;

export type UseNotificationsOptions = {
  filter?: UseNotificationsFilter;
  requireTarget?: boolean;
  target?: NotificationTarget;
};

export const useNotifications = (options?: UseNotificationsOptions): Notification[] => {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const notifications = state.notifications;
      const target = options?.target;
      const byTarget = target
        ? notifications.filter((notification) =>
            isNotificationForTarget(notification, target, {
              claimOwner: client.notifications,
            }),
          )
        : options?.requireTarget
          ? []
          : notifications;

      return {
        notifications: options?.filter ? byTarget.filter(options.filter) : byTarget,
      };
    },
    [client.notifications, options?.filter, options?.requireTarget, options?.target],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
