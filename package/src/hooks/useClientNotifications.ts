import type { NotificationManagerState } from 'stream-chat';

import { useStateStore } from './useStateStore';

import { useChatContext } from '../contexts/chatContext/ChatContext';

const selector = (state: NotificationManagerState) => ({
  notifications: state.notifications,
});

/**
 * This hook is used to get the notifications from the client.
 * @returns {Object} - An object containing the notifications.
 * @returns {Notification[]} notifications - The notifications.
 */
export const useClientNotifications = () => {
  const { client } = useChatContext();
  const { notifications } = useStateStore(client.notifications.store, selector);

  return { notifications };
};
