import * as MediaLibrary from 'expo-media-library';
import type { Asset } from 'stream-chat-react-native-core';

type ReturnType = {
  assets: Array<Omit<Asset, 'source'> & { source: 'picker' }>;
  endCursor: string | undefined;
  hasNextPage: boolean;
  iOSLimited: boolean;
};

export const getPhotos = async ({
  after,
  first,
}: MediaLibrary.AssetsOptions): Promise<ReturnType> => {
  try {
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
    const assets = results.assets.map((asset) => ({
      duration: asset.duration,
      height: asset.height,
      id: asset.id,
      name: asset.filename,
      source: 'picker' as const,
      type: asset.mediaType,
      uri: asset.uri,
      width: asset.width,
    }));

    const hasNextPage = results.hasNextPage;
    const endCursor = results.endCursor;
    return { assets, endCursor, hasNextPage, iOSLimited: accessPrivileges === 'limited' };
  } catch {
    throw new Error('getPhotos Error');
  }
};
