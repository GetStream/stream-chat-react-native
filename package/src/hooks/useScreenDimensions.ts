import { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

/**
 * A custom hook that provides functions to calculate dimensions based on
 * a percentage of the screen height (vh) and viewport width (vw). It
 * dynamically updates dimensions on changes in device orientation.
 *
 * @returns {Object} An object containing functions vh and vw.
 */
export const useScreenDimensions = (rounded?: boolean) => {
  const [screenDimensions, setScreenDimensions] = useState(() => Dimensions.get('screen'));

  useEffect(() => {
    const handleChange = ({ screen }: { screen: ScaledSize }) => {
      setScreenDimensions((prev) => {
        const { height, width } = screen;
        if (prev.height !== height || prev.width !== width) {
          return screen;
        }
        return prev;
      });
    };
    const subscription = Dimensions.addEventListener('change', handleChange);

    // We might have missed an update between calling `get` in render and
    // `addEventListener` in this handler, so we set it here. If there was
    // no change, React will filter out this update as a no-op.
    // pattern ref: react-native-repo/packages/react-native/Libraries/Utilities/useWindowDimensions.js
    handleChange({ screen: Dimensions.get('screen') });

    return () => {
      subscription.remove();
    };
  }, []);

  const vw = useCallback(
    (percentageWidth: number) => {
      const value = screenDimensions.width * (percentageWidth / 100);
      return rounded ? Math.round(value) : value;
    },
    [rounded, screenDimensions.width],
  );

  const vh = useCallback(
    (percentageHeight: number) => {
      const value = screenDimensions.height * (percentageHeight / 100);
      return rounded ? Math.round(value) : value;
    },
    [rounded, screenDimensions.height],
  );

  return { vh, vw };
};
