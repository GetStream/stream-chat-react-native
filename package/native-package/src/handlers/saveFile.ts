import RNFS from 'react-native-fs';

export const saveFile = async ({ fileName, fromUrl }: { fileName: string; fromUrl: string }) => {
  try {
    const path = RNFS.CachesDirectoryPath + '/' + encodeURIComponent(fileName);
    await RNFS.downloadFile({ fromUrl, toFile: path }).promise;
    return 'file://' + path;
  } catch (error) {
    throw new Error('Downloading image failed...');
  }
};
