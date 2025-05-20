import { AppState, Image, PermissionsAndroid, Platform } from 'react-native';

let ImagePicker;

try {
  ImagePicker = require('react-native-image-picker');
} catch (e) {
  console.log(
    'The package react-native-image-picker is not installed. Installing this package will enable capturing photos and videos(for iOS) through the app, and thereby send it.',
  );
}

export const takePhoto = ImagePicker
  ? async ({
      compressImageQuality = Platform.OS === 'ios' ? 0.8 : 1,
      mediaType = Platform.OS === 'ios' ? 'mixed' : 'image',
    }) => {
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
        const result = await ImagePicker.launchCamera({
          mediaType,
          quality: Math.min(Math.max(0, compressImageQuality), 1),
        });
        if (!result || !result.assets || !result.assets.length || result.didCancel) {
          return {
            cancelled: true,
          };
        }
        const asset = result.assets[0];
        if (!asset) {
          return {
            cancelled: true,
          };
        }
        if (asset.type.includes('video')) {
          const clearFilter = new RegExp('[.:]', 'g');
          const date = new Date().toISOString().replace(clearFilter, '_');
          return {
            ...asset,
            cancelled: false,
            duration: asset.duration * 1000,
            name: 'video_recording_' + date + '.' + asset.fileName.split('.').pop(),
            size: asset.fileSize,
            type: asset.type,
            uri: asset.uri,
          };
        } else {
          if (asset.height && asset.width && asset.uri) {
            let size: { height?: number; width?: number } = {};
            if (Platform.OS === 'android') {
              // Height and width returned by ImagePicker are incorrect on Android.
              const getSize = (): Promise<{ height: number; width: number }> =>
                new Promise((resolve) => {
                  Image.getSize(asset.uri, (width, height) => {
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
                height: asset.height,
                width: asset.width,
              };
            }
            const clearFilter = new RegExp('[.:]', 'g');
            const date = new Date().toISOString().replace(clearFilter, '_');
            return {
              cancelled: false,
              name: 'image_' + date + '.' + asset.uri.split('.').pop(),
              size: asset.fileSize,
              type: asset.type,
              uri: asset.uri,
              ...size,
            };
          }
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
