import RNFS from 'react-native-fs';

export const deleteFile = async ({ uri }: { uri: string }) => {
  try {
    await RNFS.unlink(uri);
    return true;
  } catch (error) {
    console.log('File deletion failed...');
    return false;
  }
};
