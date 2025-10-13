import { impactFeedback, notificationFeedback, selectionFeedback } from '../native';

import { ImpactFeedbackType, NotificationFeedbackType } from '../native/types';

type HapticFeedbackTypes =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning';

export const triggerHaptic = async (method: HapticFeedbackTypes) => {
  switch (method) {
    case 'impactHeavy':
      await impactFeedback(ImpactFeedbackType.Heavy);
      break;
    case 'impactLight':
      await impactFeedback(ImpactFeedbackType.Light);
      break;
    case 'impactMedium':
      await impactFeedback(ImpactFeedbackType.Medium);
      break;
    case 'notificationError':
      await notificationFeedback(NotificationFeedbackType.Error);
      break;
    case 'notificationSuccess':
      await notificationFeedback(NotificationFeedbackType.Success);
      break;
    case 'notificationWarning':
      await notificationFeedback(NotificationFeedbackType.Warning);
      break;
    default:
      await selectionFeedback();
  }
};
