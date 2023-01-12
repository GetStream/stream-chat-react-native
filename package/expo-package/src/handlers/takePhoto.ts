import { Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

type Size = {
  width?: number;
  height?: number;
};

export const takePhoto = async ({ compressImageQuality = 1 }) => {
  try {
    const permissionCheck = await ImagePicker.getCameraPermissionsAsync();
    const permissionGranted =
      permissionCheck?.status === 'granted'
        ? permissionCheck
        : await ImagePicker.requestCameraPermissionsAsync();

    if (permissionGranted?.status === 'granted' || permissionGranted?.granted === true) {
      const photo = await ImagePicker.launchCameraAsync({
        quality: Math.min(Math.max(0, compressImageQuality), 1),
      });

      if (photo.cancelled === false && photo.height && photo.width && photo.uri) {
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
};
