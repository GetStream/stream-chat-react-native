import { Platform } from 'react-native';
import mime from 'mime';

import type { File } from 'stream-chat-react-native-core';

let MediaLibrary;

try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // do nothing
}

if (!MediaLibrary) {
  console.log(
    'expo-media-library is not installed. Please install it or you can choose to install expo-image-picker for native image picker.',
  );
}

import { getLocalAssetUri } from './getLocalAssetUri';

type ReturnType = {
  assets: File[];
  endCursor: string | undefined;
  hasNextPage: boolean;
  iOSLimited: boolean;
};

export const getPhotos = MediaLibrary
  ? async ({ after, first }): Promise<ReturnType> => {
      try {
        if (Platform.OS === 'android') {
          console.warn(
            'expo-media-library can be removed in favour of new google policy(https://support.google.com/googleplay/android-developer/answer/14115180?hl=en) if you do not have gallery as your core feature of the app.\nYou can replace it with expo-image-picker and uninstall it. Guide - https://getstream.io/chat/docs/sdk/react-native/guides/native-image-picker/.',
          );
        }
        // NOTE:
        // should always check first before requesting permission
        // because always requesting permission will cause
        // the app to go to background even if it was granted
        const { accessPrivileges, status } = await MediaLibrary.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            throw new Error('getPhotos Error');
          }
        }
        const results = await MediaLibrary.getAssetsAsync({
          after,
          first,
          mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
          sortBy: [MediaLibrary.SortBy.modificationTime],
        });
        const assets = await Promise.all(
          results.assets.map(async (asset) => {
            const localUri = await getLocalAssetUri(asset.id);
            const mimeType = mime.getType(asset.filename);
            return {
              duration: asset.duration * 1000,
              height: asset.height,
              name: asset.filename,
              thumb_url: asset.mediaType === 'photo' ? undefined : asset.uri,
              type: mimeType,
              uri: localUri || asset.uri,
              width: asset.width,
            };
          }),
        );

        const hasNextPage = results.hasNextPage;
        const endCursor = results.endCursor;
        return { assets, endCursor, hasNextPage, iOSLimited: accessPrivileges === 'limited' };
      } catch {
        throw new Error('getPhotos Error');
      }
    }
  : null;
