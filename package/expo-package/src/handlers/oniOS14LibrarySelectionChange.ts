import { Platform } from 'react-native';

import * as MediaLibrary from 'expo-media-library';

const isAboveIOS14 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 14;

export function oniOS14GalleryLibrarySelectionChange(callback: () => void): {
  unsubscribe: () => void;
} {
  if (isAboveIOS14) {
    const subscription = MediaLibrary.addListener(callback);
    return {
      unsubscribe: () => {
        subscription.remove();
      },
    };
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unsubscribe: () => {},
  };
}
