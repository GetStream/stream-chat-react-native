import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Horizontal safe area padding for a surface that spans the full window width.
 *
 * **Only for surfaces an integrator cannot wrap.** Everything the SDK renders in-tree is left
 * alone: the integrator wraps their screen in a `SafeAreaView` and the whole subtree - including
 * absolutely positioned children, which track their containing block's border box - narrows with
 * it. Applying this to an in-tree surface double-pads it for every integrator who already wraps.
 *
 * In practice that leaves React Native's own `Modal`, which renders in a separate native window.
 * A bottom sheet or an overlay is *not* automatically out of reach - check where it actually
 * mounts. Prefer a `SafeAreaView` (see `ImageGalleryHeader`/`Footer`) wherever one fits: it
 * compares the window inset against its own measured frame, so a nested instance contributes
 * nothing once an ancestor has narrowed the subtree. This hook reads `useSafeAreaInsets`, which is
 * window-global and has no such protection.
 *
 * `left` and `right` are never collapsed into one value: from iOS 27 the system stacks its controls
 * down a single edge, so the two differ (measured 0 and 84 on iPhone Duo).
 *
 * A side whose inset is 0 is omitted rather than emitted as `paddingLeft: 0`, because a longhand
 * overrides a `padding` shorthand for that side - emitting a zero would silently drop padding the
 * component or a consumer's theme had already set.
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
