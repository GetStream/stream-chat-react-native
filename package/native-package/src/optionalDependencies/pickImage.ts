import { Platform } from 'react-native';

import mime from 'mime';

import { PickImageOptions } from 'stream-chat-react-native-core';

import { generateThumbnails } from './generateThumbnail';

let ImagePicker;

try {
  ImagePicker = require('react-native-image-picker');
} catch (e) {
  console.log('react-native-image-picker is not installed');
}

export const pickImage = ImagePicker
  ? async ({ maxNumberOfFiles }: PickImageOptions = {}) => {
      try {
        const result = await ImagePicker.launchImageLibrary({
          assetRepresentationMode: 'current',
          mediaType: 'mixed',
          selectionLimit: maxNumberOfFiles,
        });
        const canceled = result.didCancel;
        const errorCode = result.errorCode;

        if (Platform.OS === 'ios' && errorCode === 'permission') {
          return { askToOpenSettings: true, cancelled: true };
        }
        if (!canceled) {
          const assetsWithType = result.assets.map((asset) => {
            const type =
              asset.type ||
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
          const videoThumbnailResults = await generateThumbnails(videoUris);

          const assets = assetsWithType.map(({ asset, isVideo, type }) => {
            const thumbnailResult =
              isVideo && asset.uri ? videoThumbnailResults[asset.uri] : undefined;

            return {
              ...asset,
              duration: asset.duration ? asset.duration * 1000 : undefined, // in milliseconds
              name: asset.fileName,
              size: asset.fileSize,
              thumb_url: thumbnailResult?.uri || undefined,
              type,
              uri: asset.uri,
            };
          });
          return { assets, cancelled: false };
        } else {
          return { cancelled: true };
        }
      } catch (error) {
        console.log('Error picking image: ', error);
        return { cancelled: true };
      }
    }
  : null;
