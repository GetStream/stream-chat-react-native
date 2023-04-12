import { PermissionsAndroid, Platform } from 'react-native';

import { CameraRoll, GetPhotosParams } from '@react-native-camera-roll/camera-roll';

const verifyAndroidPermissions = async () => {
  const isRN71orAbove = Platform.constants.reactNativeVersion?.minor >= 71;
  const isAndroid13orAbove = Platform.Version >= 33;
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

export const getPhotos = async ({ after, first }: Pick<GetPhotosParams, 'after' | 'first'>) => {
  try {
    if (Platform.OS === 'android') {
      const granted = await verifyAndroidPermissions();
      if (!granted) {
        throw new Error('getPhotos Error');
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
