import * as MediaLibrary from 'expo-media-library';

export const getPhotos = async ({ after, first }: MediaLibrary.AssetsOptions) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('getPhotos Error');
    }
    const results = await MediaLibrary.getAssetsAsync({
      after,
      first,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      sortBy: [MediaLibrary.SortBy.modificationTime],
    });
    const assets = results.assets.map((asset) => ({
      duration: asset.duration,
      filename: asset.filename,
      height: asset.height,
      id: asset.id,
      source: 'picker',
      type: asset.mediaType,
      uri: asset.uri,
      width: asset.width,
    }));

    const hasNextPage = results.hasNextPage;
    const endCursor = results.endCursor;
    return { assets, endCursor, hasNextPage };
  } catch {
    throw new Error('getPhotos Error');
  }
};
