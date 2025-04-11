import { Platform } from 'react-native';
let ImagePicker;

try {
  ImagePicker = require('react-native-image-picker');
} catch (e) {
  console.log('react-native-image-picker is not installed');
}

export const pickImage = ImagePicker
  ? async () => {
      try {
        const result = await ImagePicker.launchImageLibrary({
          assetRepresentationMode: 'current',
          mediaType: 'mixed',
        });
        const canceled = result.didCancel;
        const errorCode = result.errorCode;

        if (Platform.OS === 'ios' && errorCode === 'permission') {
          return { askToOpenSettings: true, cancelled: true };
        }
        if (!canceled) {
          const assets = result.assets.map((asset) => ({
            ...asset,
            duration: asset.duration ? asset.duration * 1000 : undefined, // in milliseconds
            name: asset.fileName,
            size: asset.fileSize,
            type: asset.type,
            uri: asset.uri,
          }));
          return { assets, cancelled: false };
        } else {
          return { cancelled: true };
        }
      } catch (error) {
        console.log('Error picking image: ', error);
        return { cancelled: true };
      }
    }
  : null;
