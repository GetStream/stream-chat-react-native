import { useWindowDimensions } from 'react-native';

export type ScreenOrientation = 'landscape' | 'portrait';

/**
 * A custom hook that derives the current screen orientation from the window
 * dimensions. It updates automatically on device rotation via
 * `useWindowDimensions`.
 *
 * @returns {ScreenOrientation} Either `'landscape'` or `'portrait'`.
 */
export const useScreenOrientation = (): ScreenOrientation => {
  const { height, width } = useWindowDimensions();
  return width > height ? 'landscape' : 'portrait';
};
