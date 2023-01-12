import * as Haptics from 'expo-haptics';

type HapticFeedbackTypes =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning';

export const triggerHaptic = (method: HapticFeedbackTypes) => {
  switch (method) {
    case 'impactHeavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'impactLight':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'impactMedium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'notificationError':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'notificationSuccess':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'notificationWarning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    default:
      Haptics.selectionAsync();
  }
};
