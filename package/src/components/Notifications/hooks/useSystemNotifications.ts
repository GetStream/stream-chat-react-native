import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { hasSystemNotificationTag } from './useNotificationApi';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

export type UseSystemNotificationsFilter = (notification: Notification) => boolean;

export type UseSystemNotificationsOptions = {
  filter?: UseSystemNotificationsFilter;
};

export const useSystemNotifications = (options?: UseSystemNotificationsOptions): Notification[] => {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const withSystemTag = state.notifications.filter(hasSystemNotificationTag);
      return {
        notifications: options?.filter ? withSystemTag.filter(options.filter) : withSystemTag,
      };
    },
    [options?.filter],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
