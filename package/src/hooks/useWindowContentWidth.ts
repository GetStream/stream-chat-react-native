import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Width available to a surface that spans the window, minus the horizontal safe area.
 *
 * Deliberately *not* measured. `onLayout` reports a frame after the window has already resized, so
 * anything sized from it - tile sizes in a grid, for instance - visibly resizes a frame late on a
 * rotation or a fold.
 *
 * The frame comes from `useSafeAreaFrame`, not `useWindowDimensions`: the frame and the insets are
 * delivered by the *same* native event and set in the same handler, so they update together in one
 * render. Mixing `Dimensions` with the insets desyncs them - the window width lands first and the
 * insets a render later, producing an extra intermediate size (and, for anything deriving an image
 * URL from it, an extra fetch).
 *
 * Assumes the caller fills the window. A component rendered inside a narrower container must pass
 * that container's width via `containerWidth`, or measure it itself and accept the frame of lag
 * that comes with measuring.
 *
 * @param containerWidth Width of the surface, when it is known and narrower than the window.
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
