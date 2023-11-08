import { Platform } from 'react-native';

import { iosRefreshGallerySelection } from '@react-native-camera-roll/camera-roll';

const isAboveIOS14 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14;

export const iOS14RefreshGallerySelection = (): Promise<void> => {
  if (isAboveIOS14) {
    return iosRefreshGallerySelection().then(() => {
      //do nothing
    });
  }
  return Promise.resolve();
};
