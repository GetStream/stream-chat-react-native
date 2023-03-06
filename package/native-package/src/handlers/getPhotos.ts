import { PermissionsAndroid, Platform } from 'react-native';

import { CameraRoll, GetPhotosParams } from '@react-native-camera-roll/camera-roll';

export const getPhotos = async ({ after, first }: Pick<GetPhotosParams, 'after' | 'first'>) => {
  try {
    if (Platform.OS === 'android') {
      const readExternalStoragePermissionAndroid =
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
      const hasPermission = await PermissionsAndroid.check(readExternalStoragePermissionAndroid);
      if (!hasPermission) {
        const granted = await PermissionsAndroid.request(readExternalStoragePermissionAndroid, {
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Me Later',
          buttonPositive: 'Allow',
          message: 'Permissions are required to access and share photos.',
          title: 'Photos Access',
        });
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('getPhotos Error');
        }
      }
    }
    const results = await CameraRoll.getPhotos({
      after,
      assetType: 'All',
      first,
      include: ['fileSize', 'filename', 'imageSize', 'playableDuration'],
    });
    const assets = results.edges.map((edge) => ({
      ...edge.node.image,
      source: 'picker',
    }));
    const hasNextPage = results.page_info.has_next_page;
    const endCursor = results.page_info.end_cursor;
    return { assets, endCursor, hasNextPage };
  } catch (_error) {
    throw new Error('getPhotos Error');
  }
};
