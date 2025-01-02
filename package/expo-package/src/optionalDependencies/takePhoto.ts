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

export const takePhoto = ImagePicker
  ? async ({ compressImageQuality = 1 }) => {
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
          const imagePickerSuccessResult = await ImagePicker.launchCameraAsync({
            mediaTypes: Platform.OS === 'ios' ? ['images', 'videos'] : 'images',
            quality: Math.min(Math.max(0, compressImageQuality), 1),
          });
          const canceled = imagePickerSuccessResult.canceled;
          const assets = imagePickerSuccessResult.assets;
          // since we only support single photo upload for now we will only be focusing on 0'th element.
          const photo = assets && assets[0];
          if (Platform.OS === 'ios') {
            if (photo.mimeType.includes('video')) {
              const clearFilter = new RegExp('[.:]', 'g');
              const date = new Date().toISOString().replace(clearFilter, '_');
              return {
                ...photo,
                cancelled: false,
                duration: photo.duration,
                source: 'camera',
                name: 'video_recording_' + date + photo.uri.split('.').pop(),
                size: photo.fileSize,
                type: photo.mimeType,
                uri: photo.uri,
              };
            }
          }
          if (canceled === false && photo && photo.height && photo.width && photo.uri) {
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

            return {
              cancelled: false,
              size: photo.fileSize,
              type: photo.mimeType,
              source: 'camera',
              uri: photo.uri,
              ...size,
            };
          }
        }
      } catch (error) {
        console.log(error);
      }
      return { cancelled: true };
    }
  : null;
