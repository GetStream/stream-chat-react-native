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

export const getLocalAssetUri = async (assetId: string): Promise<string | undefined> => {
  try {
    const { localUri } = await MediaLibrary.getAssetInfoAsync(assetId);
    return localUri;
  } catch {
    throw new Error('getLocalAssetUri Error');
  }
};
