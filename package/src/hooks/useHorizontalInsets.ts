import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Horizontal safe area padding for a surface that spans the full window width.
 *
 * `left` and `right` are never collapsed into one value: from iOS 27 the system stacks its controls
 * down a single edge, so the two differ (measured 0 and 84 on iPhone Duo).
 *
 * A side whose inset is 0 is omitted rather than emitted as `paddingLeft: 0`, because a longhand
 * overrides a `padding` shorthand for that side - emitting a zero would silently drop padding the
 * component or a consumer's theme had already set.
 *
 * Nesting two of these double-pads.
 */
export const useHorizontalInsets = (): ViewStyle => {
  const { left, right } = useSafeAreaInsets();

  return useMemo<ViewStyle>(
    () => ({
      ...(left > 0 ? { paddingLeft: left } : null),
      ...(right > 0 ? { paddingRight: right } : null),
    }),
    [left, right],
  );
};
