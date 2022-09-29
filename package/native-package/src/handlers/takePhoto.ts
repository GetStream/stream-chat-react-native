import { Image, Platform } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';

export const takePhoto = async ({ compressImageQuality = Platform.OS === 'ios' ? 0.8 : 1 }) => {
  const photo = await ImagePicker.openCamera({
    compressImageQuality: Math.min(Math.max(0, compressImageQuality), 1),
  });

  if (photo.height && photo.width && photo.path) {
    let size: { height?: number; width?: number } = {};
    if (Platform.OS === 'android') {
      // Height and width returned by ImagePicker are incorrect on Android.
      // The issue is described in following github issue:
      // https://github.com/ivpusic/react-native-image-crop-picker/issues/901
      // This we can't rely on them as it is, and we need to use Image.getSize
      // to get accurate size.
      const getSize = (): Promise<{ height: number; width: number }> =>
        new Promise((resolve) => {
          Image.getSize(photo.path, (width, height) => {
            resolve({ height, width });
          });
        });

      try {
        const { height, width } = await getSize();
        size.height = height;
        size.width = width;
      } catch (e) {
        // do nothing
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
      uri: photo.path,
      ...size,
    };
  }
  return { cancelled: true };
};
