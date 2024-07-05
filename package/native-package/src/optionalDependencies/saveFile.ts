let RNBlobUtil;

try {
  RNBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util is not installed');
}

export const saveFile = RNBlobUtil
  ? async ({ fileName, fromUrl }) => {
      try {
        const path = RNBlobUtil.fs.dirs.CacheDir + '/' + encodeURIComponent(fileName);
        await RNBlobUtil.config({
          fileCache: true,
          path,
        }).fetch('GET', fromUrl);

        return path;
      } catch (error) {
        console.log('Downloading image failed...', error);
        throw new Error('Downloading image failed...');
      }
    }
  : null;
