let FileSystem;

try {
  FileSystem = require('expo-file-system');
} catch (e) {
  // do nothing
}

if (!FileSystem) {
  console.log(
    'expo-file-system is not installed. Installing this package will allow your users to save/delete file locally and access the cache dir for android/iOS.',
  );
}

export const saveFile = FileSystem
  ? async ({ fileName, fromUrl }: { fileName: string; fromUrl: string }) => {
      try {
        const path = FileSystem.cacheDirectory + encodeURIComponent(fileName);
        const downloadedImage = await FileSystem.downloadAsync(fromUrl, path);
        return downloadedImage.uri;
      } catch (error) {
        console.log('Downloading image failed...', error);
        throw new Error('Downloading image failed...');
      }
    }
  : null;
