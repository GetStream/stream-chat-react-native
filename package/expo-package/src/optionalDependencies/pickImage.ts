import { Platform } from 'react-native';

import mime from 'mime';

import { PickImageOptions } from 'stream-chat-react-native-core';

import { generateThumbnails } from './generateThumbnail';

let ImagePicker;

try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // do nothing
}

if (!ImagePicker) {
  console.log(
    'expo-image-picker is not installed. Installing this package will enable selecting photos through the native image picker, and thereby send it.',
  );
}

export const pickImage = ImagePicker
  ? async ({ maxNumberOfFiles }: PickImageOptions = {}) => {
      try {
        let permissionGranted = true;
        if (Platform.OS === 'ios') {
          const permissionCheck = await ImagePicker.getMediaLibraryPermissionsAsync();
          const canRequest = permissionCheck.canAskAgain;
          permissionGranted = permissionCheck.granted;
          if (!permissionGranted) {
            if (canRequest) {
              const response = await ImagePicker.requestMediaLibraryPermissionsAsync();
              permissionGranted = response.granted;
            } else {
              return { askToOpenSettings: true, cancelled: true };
            }
          }
        }
        if (permissionGranted) {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: true,
            mediaTypes: ['images', 'videos'],
            preferredAssetRepresentationMode: 'current',
            selectionLimit: maxNumberOfFiles,
          });

          const canceled = result.canceled;

          if (!canceled) {
            const assetsWithType = result.assets.map((asset) => {
              const type =
                asset.mimeType ||
                mime.getType(asset.fileName || asset.uri) ||
                (asset.duration ? 'video/*' : 'image/*');

              return {
                asset,
                isVideo: type.includes('video'),
                type,
              };
            });
            const videoUris = assetsWithType
              .filter(({ asset, isVideo }) => isVideo && !!asset.uri)
              .map(({ asset }) => asset.uri);
            const videoThumbnailUris = await generateThumbnails(videoUris);
            let videoIndex = 0;

            const assets = assetsWithType.map(({ asset, isVideo, type }) => ({
              ...asset,
              duration: asset.duration,
              name: asset.fileName,
              size: asset.fileSize,
              thumb_url: isVideo ? videoThumbnailUris[videoIndex++] : undefined,
              type,
              uri: asset.uri,
            }));
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
    }
  : null;
