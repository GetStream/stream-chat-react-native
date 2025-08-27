import { Notification, StateStore } from 'stream-chat';

export type InAppNotificationsState = {
  notifications: Notification[];
};

const INITIAL_STATE: InAppNotificationsState = {
  notifications: [],
};

export const inAppNotificationsStore = new StateStore<InAppNotificationsState>(INITIAL_STATE);

export const openInAppNotification = (notification: Notification) => {
  if (!notification.id) {
    console.warn('Notification must have an id to be opened!');
    return;
  }
  const { notifications } = inAppNotificationsStore.getLatestValue();

  // Prevent duplicate notifications
  if (notifications.some((n) => n.id === notification.id)) {
    console.warn('Notification with the same id already exists!');
    return;
  }

  inAppNotificationsStore.partialNext({
    notifications: [...notifications, notification],
  });
};

export const closeInAppNotification = (id: string) => {
  if (!id) {
    console.warn('Notification id is required to be closed!');
    return;
  }
  const { notifications } = inAppNotificationsStore.getLatestValue();
  inAppNotificationsStore.partialNext({
    notifications: notifications.filter((notification) => notification.id !== id),
  });
};
