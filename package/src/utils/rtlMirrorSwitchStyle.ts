import { useMemo } from 'react';
import { I18nManager, Platform, ViewStyle } from 'react-native';

type RtlMirrorSwitchStyle = Pick<ViewStyle, 'transform'>;

/**
 * Style that mirrors `Switch` horizontally in RTL on iOS so thumb/track match layout direction.
 * The returned object is stable across renders while `I18nManager.isRTL` is unchanged (`useMemo`).
 */
export function useRtlMirrorSwitchStyle(): RtlMirrorSwitchStyle {
  const isRTL = I18nManager.isRTL;
  return useMemo(() => {
    if (Platform.OS !== 'ios' || !isRTL) {
      return {};
    }
    return {
      transform: [{ scaleX: -1 }],
    };
  }, [isRTL]);
}
