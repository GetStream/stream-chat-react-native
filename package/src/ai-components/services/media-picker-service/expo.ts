import {
  AbstractMediaPickerService,
  type MediaAsset,
  type PickMediaOpts,
} from './AbstractMediaPickerService.ts';
import { Image, Platform } from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';

let internalService = undefined;

try {
  // eslint-disable-next-line
  internalService = require('expo-image-picker');
} catch (_error) {
  /* do nothing */
}

type Size = {
  height?: number;
  width?: number;
};

class ExpoMediaPickerService extends AbstractMediaPickerService {
  pickMedia = async ({ maxNumberOfFiles = 3 }: PickMediaOpts = {}) => {
    try {
      let permissionGranted = true;
      if (Platform.OS === 'ios') {
        const permissionCheck =
          await internalService!.getMediaLibraryPermissionsAsync();
        const canRequest = permissionCheck.canAskAgain;
        permissionGranted = permissionCheck.granted;
        if (!permissionGranted) {
          if (canRequest) {
            const response =
              await internalService!.requestMediaLibraryPermissionsAsync();
            permissionGranted = response.granted;
          } else {
            return { askToOpenSettings: true, cancelled: true };
          }
        }
      }
      if (permissionGranted) {
        const result = await internalService!.launchImageLibraryAsync({
          allowsMultipleSelection: true,
          mediaTypes: 'images',
          preferredAssetRepresentationMode: 'current',
          selectionLimit: maxNumberOfFiles,
        });

        const canceled = result.canceled;

        if (!canceled) {
          const assets = result.assets.map((asset: ImagePickerAsset) => ({
            ...asset,
            name: asset.fileName,
            size: asset.fileSize,
            type: asset.mimeType,
            uri: asset.uri,
          }));
          this.appendAssets(assets);
          return { assets, cancelled: false };
        } else {
          return { cancelled: true };
        }
      }
      return { cancelled: true };
    } catch (error) {
      console.log('Error while picking image', error);
      return { cancelled: true };
    }
  };

  takeMedia = async ({ compressionQuality = 1 }) => {
    try {
      const permissionCheck =
        await internalService!.getCameraPermissionsAsync();
      const canRequest = permissionCheck.canAskAgain;
      let permissionGranted = permissionCheck.granted;
      if (!permissionGranted) {
        if (canRequest) {
          const response =
            await internalService!.requestCameraPermissionsAsync();
          permissionGranted = response.granted;
        } else {
          return { askToOpenSettings: true, cancelled: true };
        }
      }

      if (permissionGranted) {
        const result = await internalService!.launchCameraAsync({
          mediaTypes: 'images',
          quality: Math.min(Math.max(0, compressionQuality), 1),
        });
        if (
          !result ||
          !result.assets ||
          !result.assets.length ||
          result.canceled
        ) {
          return { cancelled: true };
        }
        // since we only support single photo upload for now we will only be focusing on 0'th element.
        const photo = result.assets[0];
        if (!photo) {
          return { cancelled: true };
        }
        if (
          photo &&
          photo.mimeType.includes('image') &&
          photo.height &&
          photo.width &&
          photo.uri
        ) {
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
              console.warn(
                'Error get image size of picture caputred from camera ',
                e,
              );
            }
          } else {
            size = {
              height: photo.height,
              width: photo.width,
            };
          }
          const clearFilter = new RegExp('[.:]', 'g');
          const date = new Date().toISOString().replace(clearFilter, '_');
          const asset: MediaAsset = {
            name: 'image_' + date + '.' + photo.uri.split('.').pop(),
            size: photo.fileSize,
            type: photo.mimeType,
            uri: photo.uri,
            height: size.height!,
            width: size.width!,
          };
          this.appendAssets([asset]);
          return {
            cancelled: false,
            asset,
          };
        }
      }
    } catch (error) {
      console.log(error);
    }
    return { cancelled: true };
  };
}

const MediaPickerService = internalService ? ExpoMediaPickerService : undefined;

export { MediaPickerService };
