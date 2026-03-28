import { Platform } from 'react-native';

import mime from 'mime';

import { PickImageOptions } from 'stream-chat-react-native-core';

import { generateThumbnail } from './generateThumbnail';

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
          const assets = await Promise.all(
            result.assets.map(async (asset) => {
              const type =
                asset.type ||
                mime.getType(asset.fileName || asset.uri) ||
                (asset.duration ? 'video/*' : 'image/*');
              const thumb_url = type.includes('video')
                ? await generateThumbnail?.({
                    uri: asset.uri,
                  })
                : undefined;

              return {
                ...asset,
                duration: asset.duration ? asset.duration * 1000 : undefined, // in milliseconds
                name: asset.fileName,
                size: asset.fileSize,
                thumb_url,
                type,
                uri: asset.uri,
              };
            }),
          );
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
