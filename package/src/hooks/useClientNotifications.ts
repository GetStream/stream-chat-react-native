import type { NotificationManagerState } from 'stream-chat';

import { useStateStore } from './useStateStore';

import { useChatContext } from '../contexts/chatContext/ChatContext';

const selector = (state: NotificationManagerState) => ({
  notifications: state.notifications,
});

/**
 * Returns the notifications held by the client's notification manager.
 *
 * @returns An object with the `notifications`.
 */
export const useClientNotifications = () => {
  const { client } = useChatContext();
  const { notifications } = useStateStore(client.notifications.store, selector);

  return { notifications };
};
