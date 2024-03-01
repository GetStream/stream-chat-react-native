import { Platform } from 'react-native';

import * as MediaLibrary from 'expo-media-library';

const isAboveIOS14 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14;

export const iOS14RefreshGallerySelection = (): Promise<void> => {
  if (isAboveIOS14) {
    return MediaLibrary.presentPermissionsPickerAsync();
  }
  return Promise.resolve();
};
