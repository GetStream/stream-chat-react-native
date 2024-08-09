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

export const oniOS14GalleryLibrarySelectionChange = MediaLibrary
  ? (
      callback: () => void,
    ): {
      unsubscribe: () => void;
    } => {
      if (isAboveIOS14) {
        const subscription = MediaLibrary.addListener(callback);
        return {
          unsubscribe: () => {
            subscription.remove();
          },
        };
      }
      return {
        unsubscribe: () => {},
      };
    }
  : null;
