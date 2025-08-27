import { Notification } from 'stream-chat';
import { useStableCallback, useStateStore } from 'stream-chat-react-native';
import type { ToastState } from '../store/toast-store';
import { toastStore, openToast, closeToast } from '../store/toast-store';

const selector = ({ notifications }: ToastState) => ({
  notifications,
});

export const useToastState = () => {
  const { notifications } = useStateStore(toastStore, selector);

  const openToastInternal = useStableCallback((notificationData: Notification) => {
    openToast(notificationData);
  });

  const closeToastInternal = useStableCallback((id: string) => {
    closeToast(id);
  });

  return { notifications, openToast: openToastInternal, closeToast: closeToastInternal };
};
