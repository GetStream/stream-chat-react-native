import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

/**
 * A custom hook that provides functions to calculate dimensions based on
 * a percentage of the screen height (vh) and viewport width (vw). It
 * dynamically updates dimensions on changes in device orientation.
 *
 * @returns {Object} An object containing functions vh and vw.
 */
export const useScreenDimensions = (rounded?: boolean) => {
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('screen'));

  useEffect(() => {
    const subscriptions = Dimensions.addEventListener('change', ({ screen }) => {
      setScreenDimensions((prev) => {
        const { height, width } = screen;
        if (prev.height !== height || prev.width !== width) {
          return screen;
        }
        return prev;
      });
    });

    return () => subscriptions?.remove();
  }, []);

  const vw = (percentageWidth: number) => {
    const value = screenDimensions.width * (percentageWidth / 100);
    return rounded ? Math.round(value) : value;
  };

  const vh = (percentageHeight: number) => {
    const value = screenDimensions.height * (percentageHeight / 100);
    return rounded ? Math.round(value) : value;
  };

  const screenDimensionFunctions = useMemo(() => ({ vh, vw }), [vh, vw]);

  return screenDimensionFunctions;
};
