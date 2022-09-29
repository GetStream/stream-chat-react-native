let ReactNativeHapticFeedback;

try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback');
} catch (e) {
  console.warn('react-native-haptic-feedback is not installed.');
}

/**
 * Since react-native-haptic-feedback isn't installed by default, we've
 * copied the types from the package here.
 *
 * @see https://github.com/junina-de/react-native-haptic-feedback/blob/master/index.d.ts
 * */
export type HapticFeedbackTypes =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'rigid'
  | 'soft'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError'
  | 'clockTick'
  | 'contextClick'
  | 'keyboardPress'
  | 'keyboardRelease'
  | 'keyboardTap'
  | 'longPress'
  | 'textHandleMove'
  | 'virtualKey'
  | 'virtualKeyRelease'
  | 'effectClick'
  | 'effectDoubleClick'
  | 'effectHeavyClick'
  | 'effectTick';

export const triggerHaptic = ReactNativeHapticFeedback
  ? (method: HapticFeedbackTypes) => {
      ReactNativeHapticFeedback.trigger(method, {
        enableVibrateFallback: false,
        ignoreAndroidSystemSettings: false,
      });
    }
  : () => {};
