import { Platform } from 'react-native';
let ImagePicker;

try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // do nothing
}

if (!ImagePicker) {
  console.log(
    'expo-image-picker is not installed. Installing this package will enable selecting photos through the native image picker, and thereby send it.',
  );
}

export const pickImage = ImagePicker
  ? async () => {
      try {
        let permissionGranted = true;
        if (Platform.OS === 'ios') {
          const permissionCheck = await ImagePicker.getMediaLibraryPermissionsAsync();
          const canRequest = permissionCheck.canAskAgain;
          permissionGranted = permissionCheck.granted;
          if (!permissionGranted) {
            if (canRequest) {
              const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
              permissionGranted = response.granted;
            } else {
              return { askToOpenSettings: true, cancelled: true };
            }
          }
        }
        if (permissionGranted) {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            mediaTypes: ImagePicker.MediaTypeOptions.All,
          });

          const canceled = result.canceled;

          if (!canceled) {
            const assets = result.assets.map((asset) => ({
              ...asset,
              duration: asset.duration,
              name: asset.fileName,
              size: asset.fileSize,
              source: 'picker',
              type: asset.mimeType,
              uri: asset.uri,
            }));
            return { assets, cancelled: false, source: 'picker' };
          } else {
            return { cancelled: true };
          }
        }
      } catch (error) {
        console.log('Error while picking image', error);
      }
    }
  : null;
