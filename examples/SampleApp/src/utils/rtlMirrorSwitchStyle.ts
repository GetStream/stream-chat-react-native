import { I18nManager, ViewStyle } from 'react-native';

/** Mirrors Switch horizontally in RTL so thumb/track match layout direction. */
export function getRtlMirrorSwitchStyle(): Pick<ViewStyle, 'transform'> {
  return {
    transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
  };
}
