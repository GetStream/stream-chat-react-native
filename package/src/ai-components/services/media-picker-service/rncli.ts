import {
  AbstractMediaPickerService,
  type PickMediaOpts,
} from './AbstractMediaPickerService.ts';
import { AppState, Image, PermissionsAndroid, Platform } from 'react-native';
import type { Asset } from 'react-native-image-picker';

let internalService = undefined;

try {
  // eslint-disable-next-line
  internalService = require('react-native-image-picker');
} catch (_error) {
  /* do nothing */
}

class RNCLIMediaPickerService extends AbstractMediaPickerService {
  pickMedia = async ({ maxNumberOfFiles = 3 }: PickMediaOpts = {}) => {
    try {
      const result = await internalService!.launchImageLibrary({
        assetRepresentationMode: 'current',
        mediaType: 'photo',
        selectionLimit: maxNumberOfFiles,
      });
      const canceled = result.didCancel;
      const errorCode = result.errorCode;

      if (Platform.OS === 'ios' && errorCode === 'permission') {
        return { askToOpenSettings: true, cancelled: true };
      }
      if (!canceled) {
        const assets = result.assets.map((asset: Asset) => ({
          ...asset,
          name: asset.fileName,
          size: asset.fileSize,
          type: asset.type,
          uri: asset.uri,
        }));
        this.appendAssets(assets);
        return { assets, cancelled: false };
      } else {
        return { cancelled: true };
      }
    } catch (error) {
      console.log('Error picking image: ', error);
      return { cancelled: true };
    }
  };

  takeMedia = async ({
    compressionQuality = Platform.OS === 'ios' ? 0.8 : 1,
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
        } else if (
          androidPermissionStatus === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          return { askToOpenSettings: true, cancelled: true };
        }
      }
    }
    try {
      const result = await internalService!.launchCamera({
        mediaType: 'photo',
        quality: Math.min(Math.max(0, compressionQuality), 1),
      });
      if (
        !result ||
        !result.assets ||
        !result.assets.length ||
        result.didCancel
      ) {
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
          name:
            'video_recording_' + date + '.' + asset.fileName.split('.').pop(),
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
              console.warn(
                'Error while getting image size of picture captured from camera ',
                e,
              );
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
            asset: {
              name: 'image_' + date + '.' + asset.uri.split('.').pop(),
              size: asset.fileSize,
              type: asset.type,
              uri: asset.uri,
              ...size,
            },
          };
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        // on iOS: if it was in inactive state, then the user had just denied the permissions
        if (Platform.OS === 'ios' && AppState.currentState === 'active') {
          const cameraPermissionDeniedMsg =
            'User did not grant camera permission.';
          // Open settings when the user did not allow camera permissions
          if (e.message === cameraPermissionDeniedMsg) {
            return { askToOpenSettings: true, cancelled: true };
          }
        }
      }
    }

    return { cancelled: true };
  };
}

const MediaPickerService = internalService
  ? RNCLIMediaPickerService
  : undefined;

export { MediaPickerService };
