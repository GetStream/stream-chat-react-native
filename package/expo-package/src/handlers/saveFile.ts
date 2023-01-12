import * as FileSystem from 'expo-file-system';

export const saveFile = async ({ fileName, fromUrl }: { fileName: string; fromUrl: string }) => {
  try {
    const path = FileSystem.cacheDirectory + encodeURIComponent(fileName);
    const downloadedImage = await FileSystem.downloadAsync(fromUrl, path);
    return downloadedImage.uri;
  } catch (error) {
    throw new Error('Downloading image failed...');
  }
};
