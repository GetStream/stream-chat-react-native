import { useCallback, useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

/**
 * Returns `vh` and `vw` helpers that convert a percentage of the screen height or width to points,
 * updating when the screen dimensions change.
 *
 * @param rounded Rounds the results to whole points. Defaults to false.
 *
 * @deprecated These are percentages of the *screen*, not of the window the app is laid out in. The
 * two diverge once the window is resizable (Split View, fold/unfold, Android multi-window): we
 * measured an 834pt screen behind a 417pt window, and an outer 466pt screen behind a 951pt window.
 *
 * Use {@link useViewport}, the same API measured against the window, or `onLayout` on your own view
 * inside a component that does not fill the window.
 *
 * @returns An object with the `vh` and `vw` functions.
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

    // An update may have landed between `get` in render and `addEventListener`, so re-read here.
    // An unchanged value is a no-op for React.
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
