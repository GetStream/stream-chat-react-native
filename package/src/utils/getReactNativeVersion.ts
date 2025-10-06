import { Platform } from 'react-native';

export const getReactNativeVersion = () => {
  const version = Platform.constants.reactNativeVersion;
  return version;
};
