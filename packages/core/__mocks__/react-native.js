import * as ReactNative from 'react-native';

export * from 'react-native';

export const Image = ReactNative.Image;

Image.prefetch = () => Promise.resolve();

export default Object.setPrototypeOf(
  {
    Image,
  },
  ReactNative,
);
