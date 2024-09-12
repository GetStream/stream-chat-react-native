import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * A custom hook that provides functions to calculate dimensions based on
 * a percentage of the viewport height (vh) and viewport width (vw). It
 * dynamically updates dimensions on changes in device orientation.
 *
 * @returns {Object} An object containing functions vh and vw.
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
