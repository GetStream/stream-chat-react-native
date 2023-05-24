let Haptics;

try {
  Haptics = require('expo-haptics');
} catch (e) {
  // do nothing
}

if (!Haptics) {
  console.log(
    'expo-haptics is not installed. Installing this package will enable haptic feedback when scaling images in the image gallery if the scaling hits the higher or lower limits for its value.',
  );
}

type HapticFeedbackTypes =
  | 'impactHeavy'
  | 'impactLight'
  | 'impactMedium'
  | 'notificationError'
  | 'notificationSuccess'
  | 'notificationWarning';

export const triggerHaptic = Haptics
  ? (method: HapticFeedbackTypes) => {
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
    }
  : // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => {};
