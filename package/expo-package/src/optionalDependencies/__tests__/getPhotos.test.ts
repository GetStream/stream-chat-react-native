jest.mock(
  'expo-media-library',
  () => ({
    MediaType: {
      photo: 'photo',
      video: 'video',
    },
    SortBy: {
      modificationTime: 'modificationTime',
    },
    getAssetsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
  }),
  { virtual: true },
);

jest.mock('../getLocalAssetUri', () => ({
  getLocalAssetUri: jest.fn(),
}));

import * as MediaLibrary from 'expo-media-library';

import { getLocalAssetUri } from '../getLocalAssetUri';
import { getPhotos } from '../getPhotos';

const mockedMediaLibrary = MediaLibrary as {
  getAssetsAsync: jest.Mock;
  getPermissionsAsync: jest.Mock;
  requestPermissionsAsync: jest.Mock;
};

const mockedGetLocalAssetUri = getLocalAssetUri as jest.Mock;

describe('getPhotos', () => {
  beforeEach(() => {
    mockedMediaLibrary.getPermissionsAsync.mockResolvedValue({
      accessPrivileges: 'all',
      status: 'granted',
    });
    mockedMediaLibrary.requestPermissionsAsync.mockResolvedValue({
      status: 'granted',
    });
    mockedMediaLibrary.getAssetsAsync.mockReset();
    mockedGetLocalAssetUri.mockReset();
    mockedGetLocalAssetUri.mockResolvedValue(undefined);
  });

  it('falls back to media-type mime strings when filename mime detection returns null', async () => {
    mockedMediaLibrary.getAssetsAsync.mockResolvedValue({
      assets: [
        {
          duration: 0,
          filename: 'IMG_0001',
          height: 100,
          id: 'photo-1',
          mediaType: MediaLibrary.MediaType.photo,
          uri: 'ph://photo-1',
          width: 200,
        },
        {
          duration: 12,
          filename: 'VID_0002',
          height: 300,
          id: 'video-1',
          mediaType: MediaLibrary.MediaType.video,
          uri: 'ph://video-1',
          width: 400,
        },
      ],
      endCursor: undefined,
      hasNextPage: false,
    });

    const result = await getPhotos({ after: undefined, first: 20 });

    expect(result.assets).toEqual([
      expect.objectContaining({
        type: 'image/*',
      }),
      expect.objectContaining({
        type: 'video/*',
      }),
    ]);
  });
});
