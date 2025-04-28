import { PermissionsAndroid, Platform } from 'react-native';
import mime from 'mime';

import type { File } from 'stream-chat-react-native-core';

let CameraRollDependency;

try {
  CameraRollDependency = require('@react-native-camera-roll/camera-roll');
} catch (e) {
  // do nothing
  console.log(
    '@react-native-camera-roll/camera-roll is not installed. Please install it or you can choose to install react-native-image-picker for native image picker.',
  );
}

import { getLocalAssetUri } from './getLocalAssetUri';

type ReturnType = {
  assets: File[];
  endCursor: string | undefined;
  hasNextPage: boolean;
  iOSLimited: boolean;
};

const verifyAndroidPermissions = async () => {
  const isRN71orAbove = Platform.constants.reactNativeVersion?.minor >= 71;
  const isAndroid13orAbove = (Platform.Version as number) >= 33;
  const shouldCheckForMediaPermissions = isRN71orAbove && isAndroid13orAbove;
  const getCheckPermissionPromise = () => {
    if (shouldCheckForMediaPermissions) {
      return Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
      ]).then(
        ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
          hasReadMediaImagesPermission && hasReadMediaVideoPermission,
      );
    } else {
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    }
  };
  const hasPermission = await getCheckPermissionPromise();
  if (!hasPermission) {
    const getRequestPermissionPromise = () => {
      if (shouldCheckForMediaPermissions) {
        return PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]).then(
          (statuses) =>
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
              PermissionsAndroid.RESULTS.GRANTED,
        );
      } else {
        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Me Later',
          buttonPositive: 'Allow',
          message: 'Permissions are required to access and share photos.',
          title: 'Photos Access',
        }).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
      }
    };
    const granted = await getRequestPermissionPromise();
    return granted;
  }
  return true;
};

export const getPhotos = CameraRollDependency
  ? async ({ after, first }): Promise<ReturnType> => {
      try {
        if (Platform.OS === 'android') {
          console.warn(
            '@react-native-camera-roll/camera-roll can be removed in favour of new google policy(https://support.google.com/googleplay/android-developer/answer/14115180?hl=en) if you do not have gallery as your core feature of the app.\nYou can replace it with react-native-image-picker and uninstall it. Guide - https://getstream.io/chat/docs/sdk/react-native/guides/native-image-picker/.',
          );
          const granted = await verifyAndroidPermissions();
          if (!granted) {
            throw new Error('getPhotos Error');
          }
        }
        const results = await CameraRollDependency.CameraRoll.getPhotos({
          after,
          assetType: 'All',
          first,
          include: ['fileSize', 'filename', 'imageSize', 'playableDuration'],
        });
        const assets = await Promise.all(
          results.edges.map(async (edge) => {
            const originalUri = edge.node?.image?.uri;
            const type =
              Platform.OS === 'ios'
                ? mime.getType(edge.node.image.filename as string)
                : edge.node.type;
            const isImage = type.includes('image');

            const uri =
              isImage && getLocalAssetUri ? await getLocalAssetUri(originalUri) : originalUri;

            return {
              ...edge.node.image,
              name: edge.node.image.filename as string,
              duration: edge.node.image.playableDuration * 1000,
              thumb_url: isImage ? undefined : originalUri,
              size: edge.node.image.fileSize as number,
              type,
              uri,
            };
          }),
        );
        const hasNextPage = results.page_info.has_next_page;
        const endCursor = results.page_info.end_cursor;
        return { assets, endCursor, hasNextPage, iOSLimited: !!results.limited };
      } catch (_error) {
        throw new Error('getPhotos Error');
      }
    }
  : null;
