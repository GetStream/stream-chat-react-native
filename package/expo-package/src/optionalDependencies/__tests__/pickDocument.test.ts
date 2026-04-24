describe('expo pickDocument', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('adds a thumbnail for picked video files', async () => {
    const generateThumbnails = jest.fn().mockResolvedValue({
      'file:///video.mp4': { uri: 'file:///video-thumb.jpg' },
    });

    jest.doMock(
      'expo-document-picker',
      () => ({
        getDocumentAsync: jest.fn().mockResolvedValue({
          assets: [
            {
              mimeType: 'video/mp4',
              name: 'video.mp4',
              uri: 'file:///video.mp4',
            },
          ],
          canceled: false,
        }),
      }),
      { virtual: true },
    );
    jest.doMock('../generateThumbnail', () => ({
      generateThumbnails,
    }));

    const { pickDocument } = require('../pickDocument');

    await expect(pickDocument()).resolves.toEqual({
      assets: [
        {
          mimeType: 'video/mp4',
          name: 'video.mp4',
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
      'expo-document-picker',
      () => ({
        getDocumentAsync: jest.fn().mockResolvedValue({
          assets: [
            {
              mimeType: 'application/pdf',
              name: 'doc.pdf',
              uri: 'file:///doc.pdf',
            },
          ],
          canceled: false,
        }),
      }),
      { virtual: true },
    );
    jest.doMock('../generateThumbnail', () => ({
      generateThumbnails,
    }));

    const { pickDocument } = require('../pickDocument');

    await expect(pickDocument()).resolves.toEqual({
      assets: [
        {
          mimeType: 'application/pdf',
          name: 'doc.pdf',
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
