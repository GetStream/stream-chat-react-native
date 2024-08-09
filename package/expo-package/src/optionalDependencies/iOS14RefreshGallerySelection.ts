import { Platform } from 'react-native';

let MediaLibrary;

try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // do nothing
}

if (!MediaLibrary) {
  console.log(
    'expo-media-library is not installed. Please install it or you can choose to install expo-image-picker for native image picker.',
  );
}

const isAboveIOS14 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14;

export const iOS14RefreshGallerySelection = MediaLibrary
  ? (): Promise<void> => {
      if (isAboveIOS14) {
        return MediaLibrary.presentPermissionsPickerAsync();
      }
      return Promise.resolve();
    }
  : null;
