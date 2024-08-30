import { AppState, Image, PermissionsAndroid, Platform } from 'react-native';

let ImagePicker;

try {
  ImagePicker = require('react-native-image-crop-picker').default;
} catch (e) {
  console.log('react-native-image-crop-picker is not installed');
}

export const takePhoto = ImagePicker
  ? async ({ compressImageQuality = Platform.OS === 'ios' ? 0.8 : 1 }) => {
      if (Platform.OS === 'android') {
        const cameraPermissions = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (!cameraPermissions) {
          const androidPermissionStatus = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
          );
          if (androidPermissionStatus === PermissionsAndroid.RESULTS.DENIED) {
            return { cancelled: true };
          } else if (androidPermissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
            return { askToOpenSettings: true, cancelled: true };
          }
        }
      }
      try {
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
            size: photo.size,
            source: 'camera',
            uri: photo.path,
            ...size,
          };
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          // on iOS: if it was in inactive state, then the user had just denied the permissions
          if (Platform.OS === 'ios' && AppState.currentState === 'active') {
            const cameraPermissionDeniedMsg = 'User did not grant camera permission.';
            // Open settings when the user did not allow camera permissions
            if (e.message === cameraPermissionDeniedMsg) {
              return { askToOpenSettings: true, cancelled: true };
            }
          }
        }
      }

      return { cancelled: true };
    }
  : null;
