let RNBlobUtil;

try {
  RNBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util is not installed');
}

export const deleteFile = RNBlobUtil
  ? async ({ uri }) => {
      try {
        await RNBlobUtil.fs.unlink(uri);
        return true;
      } catch (error) {
        console.log('File deletion failed...', error);
        return false;
      }
    }
  : null;
