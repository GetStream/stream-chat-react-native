import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

export const triggerHaptic = (method: ReactNativeHapticFeedback.HapticFeedbackTypes) => {
  ReactNativeHapticFeedback.trigger(method, {
    enableVibrateFallback: false,
    ignoreAndroidSystemSettings: false,
  });
};
