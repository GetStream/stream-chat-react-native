import * as FileSystem from 'expo-file-system';

export const deleteFile = async ({ uri }: { uri: string }) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return true;
  } catch (error) {
    console.log('File deletion failed...');
    return false;
  }
};
