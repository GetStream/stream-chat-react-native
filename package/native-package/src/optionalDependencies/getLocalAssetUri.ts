import { Platform } from 'react-native';

let CameraRollDependency;

try {
  CameraRollDependency = require('@react-native-camera-roll/camera-roll');
} catch (e) {
  // do nothing
  console.log(
    '@react-native-camera-roll/camera-roll is not installed. Please install it or you can choose to install react-native-image-picker for native image picker.',
  );
}

export const getLocalAssetUri = CameraRollDependency
  ? async (remoteUri: string) => {
      try {
        if (Platform.OS === 'ios') {
          const imageData = await CameraRollDependency.CameraRoll.iosGetImageDataById(remoteUri);
          return imageData?.node?.image?.filepath;
        }
        return remoteUri;
      } catch {
        throw new Error('getLocalAssetUri Error');
      }
    }
  : null;
