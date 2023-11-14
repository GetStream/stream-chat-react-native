import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

/**
 * A custom hook that provides functions to calculate dimensions based on
 * a percentage of the viewport height (vh) and viewport width (vw). It
 * dynamically updates dimensions on changes in device orientation.
 *
 * @returns {Object} An object containing functions vh and vw.
 */
export const useViewport = (rounded?: boolean) => {
  const [viewportDimensions, setViewportDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscriptions = Dimensions.addEventListener('change', ({ window }) =>
      setViewportDimensions(window),
    );

    return () => subscriptions?.remove();
  }, []);

  const vw = (percentageWidth: number) => {
    const value = viewportDimensions.width * (percentageWidth / 100);
    return rounded ? Math.round(value) : value;
  };

  const vh = (percentageHeight: number) => {
    const value = viewportDimensions.height * (percentageHeight / 100);
    return rounded ? Math.round(value) : value;
  };

  return { vh, vw };
};
