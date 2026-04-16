import { NativeModules } from 'react-native';

const { StreamHapticFeedback } = NativeModules;

export const triggerHaptic = StreamHapticFeedback
  ? (method: string) => {
      StreamHapticFeedback.triggerHaptic(method);
    }
  : () => {};
