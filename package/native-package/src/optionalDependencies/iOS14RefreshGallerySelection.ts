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

const isAboveIOS14 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14;

export const iOS14RefreshGallerySelection = CameraRollDependency
  ? (): Promise<void> => {
      if (isAboveIOS14) {
        return CameraRollDependency.iosRefreshGallerySelection().then(() => {
          //do nothing
        });
      }
      return Promise.resolve();
    }
  : null;
