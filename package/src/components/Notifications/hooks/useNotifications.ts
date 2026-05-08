import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';
import { isNotificationForPanel, type NotificationTargetPanel } from '../notificationTarget';

export type UseNotificationsFilter = (notification: Notification) => boolean;

export type UseNotificationsOptions = {
  filter?: UseNotificationsFilter;
  panel?: NotificationTargetPanel;
  fallbackPanel?: NotificationTargetPanel;
};

export const useNotifications = (options?: UseNotificationsOptions): Notification[] => {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const notifications = state.notifications;
      const panel = options?.panel;
      const byPanel = panel
        ? notifications.filter((notification) =>
            isNotificationForPanel(notification, panel, {
              fallbackPanel: options?.fallbackPanel,
            }),
          )
        : notifications;

      return {
        notifications: options?.filter ? byPanel.filter(options.filter) : byPanel,
      };
    },
    [options?.fallbackPanel, options?.filter, options?.panel],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
