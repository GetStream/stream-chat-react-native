import { Image, Platform } from 'react-native';

let ImagePicker;

try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // do nothing
}

if (!ImagePicker) {
  console.log(
    'expo-image-picker is not installed. Installing this package will enable capturing photos and videos(for iOS) through the app, and thereby send it.',
  );
}

type Size = {
  height?: number;
  width?: number;
};

// Media type mapping for iOS and Android
const mediaTypeMap = {
  image: 'images',
  mixed: ['images', 'videos'],
  video: 'videos',
};

export const takePhoto = ImagePicker
  ? async ({ compressImageQuality = 1, mediaType = Platform.OS === 'ios' ? 'mixed' : 'image' }) => {
      try {
        const permissionCheck = await ImagePicker.getCameraPermissionsAsync();
        const canRequest = permissionCheck.canAskAgain;
        let permissionGranted = permissionCheck.granted;
        if (!permissionGranted) {
          if (canRequest) {
            const response = await ImagePicker.requestCameraPermissionsAsync();
            permissionGranted = response.granted;
          } else {
            return { askToOpenSettings: true, cancelled: true };
          }
        }

        if (permissionGranted) {
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: mediaTypeMap[mediaType],
            quality: Math.min(Math.max(0, compressImageQuality), 1),
          });
          if (!result || !result.assets || !result.assets.length || result.canceled) {
            return { cancelled: true };
          }
          // since we only support single photo upload for now we will only be focusing on 0'th element.
          const photo = result.assets[0];
          if (!photo) {
            return { cancelled: true };
          }
          if (photo.mimeType.includes('video')) {
            const clearFilter = new RegExp('[.:]', 'g');
            const date = new Date().toISOString().replace(clearFilter, '_');
            return {
              ...photo,
              cancelled: false,
              duration: photo.duration, // in milliseconds
              name: 'video_recording_' + date + '.' + photo.uri.split('.').pop(),
              size: photo.fileSize,
              type: photo.mimeType,
              uri: photo.uri,
            };
          } else {
            if (photo && photo.height && photo.width && photo.uri) {
              let size: Size = {};
              if (Platform.OS === 'android') {
                const getSize = (): Promise<Size> =>
                  new Promise((resolve) => {
                    Image.getSize(photo.uri, (width, height) => {
                      resolve({ height, width });
                    });
                  });

                try {
                  const { height, width } = await getSize();
                  size.height = height;
                  size.width = width;
                } catch (e) {
                  console.warn('Error get image size of picture caputred from camera ', e);
                }
              } else {
                size = {
                  height: photo.height,
                  width: photo.width,
                };
              }
              const clearFilter = new RegExp('[.:]', 'g');
              const date = new Date().toISOString().replace(clearFilter, '_');
              return {
                cancelled: false,
                name: 'image_' + date + '.' + photo.uri.split('.').pop(),
                size: photo.fileSize,
                type: photo.mimeType,
                uri: photo.uri,
                ...size,
              };
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
      return { cancelled: true };
    }
  : null;
