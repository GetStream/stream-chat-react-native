import { useWindowDimensions } from 'react-native';

export type ScreenOrientation = 'landscape' | 'portrait';

/**
 * Derives the orientation from the window dimensions, updating on rotation.
 *
 * @returns `'landscape'` when the window is wider than tall, otherwise `'portrait'`.
 */
export const useScreenOrientation = (): ScreenOrientation => {
  const { height, width } = useWindowDimensions();
  return width > height ? 'landscape' : 'portrait';
};
