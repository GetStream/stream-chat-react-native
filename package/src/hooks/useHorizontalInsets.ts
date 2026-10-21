import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Horizontal safe area padding for a surface that spans the full window width.
 *
 * Only for surfaces an integrator cannot wrap, such as React Native's `Modal`, which renders in a
 * separate native window. In-tree surfaces already narrow with the integrator's `SafeAreaView`, so
 * this would double-pad them; a bottom sheet or overlay qualifies only if it mounts outside that
 * tree. Prefer a `SafeAreaView` where one fits (see `ImageGalleryHeader`): it compares the window
 * inset with its own frame, whereas this hook reads the window-global `useSafeAreaInsets` and has
 * no such protection when nested.
 *
 * `left` and `right` stay separate because from iOS 27 the system can stack its controls down a
 * single edge (measured 0 and 84 on iPhone Duo). A side whose inset is 0 is omitted, as a
 * `paddingLeft: 0` longhand would override a `padding` shorthand set elsewhere.
 *
 * @returns A style with `paddingLeft` and `paddingRight` for the non-zero insets.
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
