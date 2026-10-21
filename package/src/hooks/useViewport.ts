import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Returns `vh` and `vw` helpers that convert a percentage of the window height or width to points,
 * updating when the window dimensions change.
 *
 * @param rounded Rounds the results to whole points. Defaults to false.
 * @returns An object with the `vh` and `vw` functions.
 */
export const useViewport = (rounded?: boolean) => {
  const viewportDimensions = useWindowDimensions();

  const vw = useCallback(
    (percentageWidth: number) => {
      const value = viewportDimensions.width * (percentageWidth / 100);
      return rounded ? Math.round(value) : value;
    },
    [rounded, viewportDimensions.width],
  );

  const vh = useCallback(
    (percentageHeight: number) => {
      const value = viewportDimensions.height * (percentageHeight / 100);
      return rounded ? Math.round(value) : value;
    },
    [rounded, viewportDimensions.height],
  );

  return { vh, vw };
};
