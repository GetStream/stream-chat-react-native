import { Image, Platform } from 'react-native';

let ImagePicker;

try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // do nothing
}

if (!ImagePicker) {
  console.log(
    'expo-image-picker is not installed. Installing this package will enable campturing photos through the app, and thereby send it.',
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
            quality: Math.min(Math.max(0, compressImageQuality), 1),
          });
          const canceled = imagePickerSuccessResult.canceled;
          const assets = imagePickerSuccessResult.assets;
          // since we only support single photo upload for now we will only be focusing on 0'th element.
          const photo = assets && assets[0];

          if (canceled === false && photo && photo.height && photo.width && photo.uri) {
            let size: Size = {};
            if (Platform.OS === 'android') {
              // Height and width returned by ImagePicker are incorrect on Android.
              // The issue is described in following github issue:
              // https://github.com/ivpusic/react-native-image-crop-picker/issues/901
              // This we can't rely on them as it is, and we need to use Image.getSize
              // to get accurate size.
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
