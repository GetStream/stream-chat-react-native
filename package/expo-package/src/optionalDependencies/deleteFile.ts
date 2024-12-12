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

export const deleteFile = FileSystem
  ? async ({ uri }: { uri: string }) => {
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        return true;
      } catch (error) {
        console.log('File deletion failed...', error);
        return false;
      }
    }
  : null;
