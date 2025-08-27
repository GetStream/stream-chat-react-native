import { Notification, StateStore } from 'stream-chat';

export type ToastState = {
  notifications: Notification[];
};

const INITIAL_STATE: ToastState = {
  notifications: [],
};

export const toastStore = new StateStore<ToastState>(INITIAL_STATE);

export const openToast = (notification: Notification) => {
  if (!notification.id) {
    console.warn('Notification must have an id to be opened!');
    return;
  }
  const { notifications } = toastStore.getLatestValue();

  // Prevent duplicate notifications
  if (notifications.some((n) => n.id === notification.id)) {
    console.warn('Notification with the same id already exists!');
    return;
  }

  toastStore.partialNext({
    notifications: [...notifications, notification],
  });
};

export const closeToast = (id: string) => {
  if (!id) {
    console.warn('Notification id is required to be closed!');
    return;
  }
  const { notifications } = toastStore.getLatestValue();
  toastStore.partialNext({
    notifications: notifications.filter((notification) => notification.id !== id),
  });
};
