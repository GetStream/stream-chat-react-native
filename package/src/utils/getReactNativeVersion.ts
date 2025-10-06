import ReactNativePackageJSON from 'react-native/package.json';

export const getReactNativeVersion = () => {
  const version = ReactNativePackageJSON.version;
  const [major, minor, patch] = version.split('.');
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
  };
};
