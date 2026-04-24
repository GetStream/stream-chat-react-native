describe('native pickDocument', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('adds a thumbnail for picked video files', async () => {
    const generateThumbnails = jest.fn().mockResolvedValue({
      'file:///video.mp4': { uri: 'file:///video-thumb.jpg' },
    });

    jest.doMock(
      '@react-native-documents/picker',
      () => ({
        pick: jest.fn().mockResolvedValue([
          {
            name: 'video.mp4',
            size: 42,
            type: 'video/mp4',
            uri: 'file:///video.mp4',
          },
        ]),
        types: { allFiles: '*/*' },
      }),
      { virtual: true },
    );
    jest.doMock('../generateThumbnail', () => ({
      generateThumbnails,
    }));

    const { pickDocument } = require('../pickDocument');

    await expect(pickDocument({ maxNumberOfFiles: 2 })).resolves.toEqual({
      assets: [
        {
          name: 'video.mp4',
          size: 42,
          thumb_url: 'file:///video-thumb.jpg',
          type: 'video/mp4',
          uri: 'file:///video.mp4',
        },
      ],
      cancelled: false,
    });
    expect(generateThumbnails).toHaveBeenCalledWith(['file:///video.mp4']);
  });

  it('does not generate thumbnails for non-video files', async () => {
    const generateThumbnails = jest.fn().mockResolvedValue({});

    jest.doMock(
      '@react-native-documents/picker',
      () => ({
        pick: jest.fn().mockResolvedValue([
          {
            name: 'doc.pdf',
            size: 42,
            type: 'application/pdf',
            uri: 'file:///doc.pdf',
          },
        ]),
        types: { allFiles: '*/*' },
      }),
      { virtual: true },
    );
    jest.doMock('../generateThumbnail', () => ({
      generateThumbnails,
    }));

    const { pickDocument } = require('../pickDocument');

    await expect(pickDocument({ maxNumberOfFiles: 2 })).resolves.toEqual({
      assets: [
        {
          name: 'doc.pdf',
          size: 42,
          thumb_url: undefined,
          type: 'application/pdf',
          uri: 'file:///doc.pdf',
        },
      ],
      cancelled: false,
    });
    expect(generateThumbnails).toHaveBeenCalledWith([]);
  });
});
