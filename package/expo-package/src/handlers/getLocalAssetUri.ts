import * as MediaLibrary from 'expo-media-library';

export const getLocalAssetUri = async (assetId: string): Promise<string> => {
  try {
    const { localUri } = await MediaLibrary.getAssetInfoAsync(assetId);
    return localUri;
  } catch {
    throw new Error('getLocalAssetUri Error');
  }
};
