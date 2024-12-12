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

// TODO: The API is different for Expo and RN CLI. We should unify it.
export const getLocalAssetUri = async (assetId: string): Promise<string | undefined> => {
  try {
    if (Platform.OS === 'ios') {
      const { localUri } = await MediaLibrary.getAssetInfoAsync(assetId);
      return localUri;
    }
    return null;
  } catch {
    throw new Error('getLocalAssetUri Error');
  }
};
