import { useMemo } from 'react';
import { I18nManager, Platform, ViewStyle } from 'react-native';

type RtlMirrorSwitchStyle = Pick<ViewStyle, 'transform'>;

/**
 * Style that mirrors a `Switch` horizontally in RTL on iOS so the thumb and track match the layout
 * direction.
 *
 * @returns A style that is stable across renders while `I18nManager.isRTL` is unchanged.
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
