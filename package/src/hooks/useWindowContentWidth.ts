import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Width available to a surface that spans the window, minus the horizontal safe area.
 *
 * The width is computed rather than measured: `onLayout` reports a frame after the window resizes,
 * so anything sized from it (such as grid tiles) resizes a frame late on rotation or fold.
 *
 * The frame comes from `useSafeAreaFrame`, not `useWindowDimensions`: the frame and the insets
 * arrive in the same native event and update in one render. Mixing `Dimensions` with the insets
 * lands the width a render before the insets, giving an extra intermediate size (and an extra fetch
 * for anything that derives an image URL from it).
 *
 * Assumes the caller fills the window. A component inside a narrower container passes that
 * container's width via `containerWidth`.
 *
 * @param containerWidth Width of the surface, when it is known and narrower than the window.
 * @returns The available width.
 *
 * @example
 * const contentWidth = useWindowContentWidth();
 * const tileSize = contentWidth / columns;
 */
export const useWindowContentWidth = (containerWidth?: number) => {
  const { width: frameWidth } = useSafeAreaFrame();
  const { left, right } = useSafeAreaInsets();

  return containerWidth ?? frameWidth - left - right;
};
