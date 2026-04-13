import { I18nManager, Platform, ViewStyle } from 'react-native';

/** Mirrors Switch horizontally in RTL on iOS so thumb/track match layout direction. */
export function getRtlMirrorSwitchStyle(): Pick<ViewStyle, 'transform'> {
  if (Platform.OS !== 'ios' || !I18nManager.isRTL) {
    return {};
  }
  return {
    transform: [{ scaleX: -1 }],
  };
}
