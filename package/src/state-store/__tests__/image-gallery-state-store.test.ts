import type { Attachment, LocalMessage } from 'stream-chat';

import { isVideoPlayerAvailable } from '../../native';
import { ImageGalleryOptions, ImageGalleryStateStore } from '../image-gallery-state-store';
import { VideoPlayerPool } from '../video-player-pool';

// Mock the VideoPlayerPool
jest.mock('../video-player-pool', () => ({
  VideoPlayerPool: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
  })),
}));

// Mock the native module
jest.mock('../../native', () => ({
  isVideoPlayerAvailable: jest.fn(() => true),
}));

const createMockMessage = (
  overrides: Partial<LocalMessage> = {},
  attachments: Attachment[] = [],
): LocalMessage =>
  ({
    attachments,
    cid: 'messaging:test-channel',
    created_at: new Date('2024-01-15T10:00:00Z'),
    id: 'message-1',
    user: { id: 'user-1', name: 'Test User' },
    user_id: 'user-1',
    ...overrides,
  }) as LocalMessage;

const createImageAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  image_url: 'https://example.com/image.jpg',
  type: 'image',
  ...overrides,
});

const createVideoAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  asset_url: 'https://example.com/video.mp4',
  mime_type: 'video/mp4',
  type: 'video',
  ...overrides,
});

const createGiphyAttachment = (overrides: Partial<Attachment> = {}): Attachment =>
  ({
    giphy: {
      fixed_height: {
        height: 200,
        url: 'https://giphy.com/fixed_height.gif',
        width: 200,
      },
      original: {
        height: 400,
        url: 'https://giphy.com/original.gif',
        width: 400,
      },
    },
    thumb_url: 'https://giphy.com/thumb.gif',
    type: 'giphy',
    ...overrides,
  }) as Attachment;

describe('ImageGalleryStateStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isVideoPlayerAvailable as jest.Mock).mockReturnValue(true);
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const store = new ImageGalleryStateStore();

      expect(store.options).toEqual({
        autoPlayVideo: false,
        giphyVersion: 'fixed_height',
      });
    });

    it('should initialize with custom options', () => {
      const customOptions: Partial<ImageGalleryOptions> = {
        autoPlayVideo: true,
        giphyVersion: 'original',
      };

      const store = new ImageGalleryStateStore(customOptions);

      expect(store.options).toEqual({
        autoPlayVideo: true,
        giphyVersion: 'original',
      });
    });

    it('should initialize state with default values', () => {
      const store = new ImageGalleryStateStore();
      const state = store.state.getLatestValue();

      expect(state).toEqual({
        currentIndex: 0,
        message: undefined,
        selectedAttachmentUrl: undefined,
      });
    });

    it('should create a VideoPlayerPool instance', () => {
      const store = new ImageGalleryStateStore();

      expect(VideoPlayerPool).toHaveBeenCalled();
      expect(store.videoPlayerPool).toBeDefined();
    });
  });

  describe('getters', () => {
    describe('message getter', () => {
      it('should return undefined when no message is set', () => {
        const store = new ImageGalleryStateStore();

        expect(store.message).toBeUndefined();
      });

      it('should return the current message', () => {
        const store = new ImageGalleryStateStore();
        const message = createMockMessage();

        store.message = message;

        expect(store.message).toEqual(message);
      });
    });

    describe('selectedAttachmentUrl getter', () => {
      it('should return undefined when no URL is selected', () => {
        const store = new ImageGalleryStateStore();

        expect(store.selectedAttachmentUrl).toBeUndefined();
      });

      it('should return the selected attachment URL', () => {
        const store = new ImageGalleryStateStore();
        const url = 'https://example.com/image.jpg';

        store.selectedAttachmentUrl = url;

        expect(store.selectedAttachmentUrl).toBe(url);
      });
    });

    describe('attachments getter', () => {
      it('should return an empty array when no message is set', () => {
        const store = new ImageGalleryStateStore();

        expect(store.attachments).toEqual([]);
      });

      it('should return an empty array when message has no attachments', () => {
        const store = new ImageGalleryStateStore();
        store.message = createMockMessage({}, []);

        expect(store.attachments).toEqual([]);
      });

      it('should filter and return only viewable image attachments', () => {
        const store = new ImageGalleryStateStore();
        const imageAttachment = createImageAttachment();
        store.message = createMockMessage({}, [imageAttachment]);

        expect(store.attachments).toEqual([imageAttachment]);
      });

      it('should filter and return only viewable video attachments when video player is available', () => {
        const store = new ImageGalleryStateStore();
        const videoAttachment = createVideoAttachment();
        store.message = createMockMessage({}, [videoAttachment]);

        expect(store.attachments).toEqual([videoAttachment]);
      });

      it('should exclude video attachments when video player is not available', () => {
        (isVideoPlayerAvailable as jest.Mock).mockReturnValue(false);
        const store = new ImageGalleryStateStore();
        const videoAttachment = createVideoAttachment();
        store.message = createMockMessage({}, [videoAttachment]);

        expect(store.attachments).toEqual([]);
      });

      it('should filter and return giphy attachments', () => {
        const store = new ImageGalleryStateStore();
        const giphyAttachment = createGiphyAttachment();
        store.message = createMockMessage({}, [giphyAttachment]);

        expect(store.attachments).toEqual([giphyAttachment]);
      });

      it('should exclude image attachments with title_link (URL previews)', () => {
        const store = new ImageGalleryStateStore();
        const imageWithTitleLink = createImageAttachment({
          title_link: 'https://example.com',
        });
        store.message = createMockMessage({}, [imageWithTitleLink]);

        expect(store.attachments).toEqual([]);
      });

      it('should exclude image attachments with og_scrape_url (Open Graph previews)', () => {
        const store = new ImageGalleryStateStore();
        const imageWithOgScrape = createImageAttachment({
          og_scrape_url: 'https://example.com',
        });
        store.message = createMockMessage({}, [imageWithOgScrape]);

        expect(store.attachments).toEqual([]);
      });

      it('should return multiple viewable attachments', () => {
        const store = new ImageGalleryStateStore();
        const imageAttachment = createImageAttachment();
        const videoAttachment = createVideoAttachment();
        const giphyAttachment = createGiphyAttachment();
        const fileAttachment: Attachment = { type: 'file' };

        store.message = createMockMessage({}, [
          imageAttachment,
          videoAttachment,
          giphyAttachment,
          fileAttachment,
        ]);

        expect(store.attachments).toEqual([imageAttachment, videoAttachment, giphyAttachment]);
      });
    });

    describe('assets getter', () => {
      it('should return an empty array when no message is set', () => {
        const store = new ImageGalleryStateStore();

        expect(store.assets).toEqual([]);
      });

      it('should map image attachments to assets correctly', () => {
        const store = new ImageGalleryStateStore();
        const imageAttachment = createImageAttachment({
          image_url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
          original_height: 600,
          original_width: 800,
          thumb_url: 'https://example.com/thumb.jpg',
        });
        const message = createMockMessage({ id: 'msg-1' }, [imageAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0]).toMatchObject({
          channelId: 'messaging:test-channel',
          id: 'photoId-msg-1-https://example.com/image.jpg',
          messageId: 'msg-1',
          mime_type: 'image/jpeg',
          original_height: 600,
          original_width: 800,
          thumb_url: 'https://example.com/thumb.jpg',
          type: 'image',
          uri: 'https://example.com/image.jpg',
          user_id: 'user-1',
        });
      });

      it('should map video attachments to assets correctly', () => {
        const store = new ImageGalleryStateStore();
        const videoAttachment = createVideoAttachment({
          asset_url: 'https://example.com/video.mp4',
          mime_type: 'video/mp4',
        });
        const message = createMockMessage({ id: 'msg-2' }, [videoAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0]).toMatchObject({
          messageId: 'msg-2',
          mime_type: 'video/mp4',
          type: 'video',
          uri: 'https://example.com/video.mp4',
        });
      });

      it('should map giphy attachments with correct mime type for gif', () => {
        const store = new ImageGalleryStateStore();
        const giphyAttachment = createGiphyAttachment();
        const message = createMockMessage({ id: 'msg-3' }, [giphyAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0].mime_type).toBe('image/gif');
        expect(assets[0].type).toBe('giphy');
      });

      it('should map giphy attachments with mp4 mime type', () => {
        const store = new ImageGalleryStateStore();
        const giphyAttachment: Attachment = {
          giphy: {
            fixed_height: {
              height: 200,
              url: 'https://giphy.com/fixed_height.mp4',
              width: 200,
            },
          } as Attachment['giphy'],
          type: 'giphy',
        };
        const message = createMockMessage({ id: 'msg-4' }, [giphyAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0].mime_type).toBe('video/mp4');
      });

      it('should map giphy attachments with webp mime type', () => {
        const store = new ImageGalleryStateStore();
        const giphyAttachment: Attachment = {
          giphy: {
            fixed_height: {
              height: 200,
              url: 'https://giphy.com/fixed_height.webp',
              width: 200,
            },
          } as Attachment['giphy'],
          type: 'giphy',
        };
        const message = createMockMessage({ id: 'msg-5' }, [giphyAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0].mime_type).toBe('image/webp');
      });

      it('should use correct giphy version from options', () => {
        const store = new ImageGalleryStateStore({ giphyVersion: 'original' });
        const giphyAttachment = createGiphyAttachment();
        const message = createMockMessage({ id: 'msg-6' }, [giphyAttachment]);
        store.message = message;

        const assets = store.assets;

        expect(assets).toHaveLength(1);
        expect(assets[0].uri).toBe('https://giphy.com/original.gif');
      });
    });

    describe('getAssetId', () => {
      it('should generate asset ID correctly', () => {
        const store = new ImageGalleryStateStore();

        const assetId = store.getAssetId('msg-123', 'https://example.com/image.jpg');

        expect(assetId).toBe('photoId-msg-123-https://example.com/image.jpg');
      });
    });
  });

  describe('setters', () => {
    describe('message setter', () => {
      it('should update the message in state', () => {
        const store = new ImageGalleryStateStore();
        const message = createMockMessage({ id: 'new-message' });

        store.message = message;

        expect(store.state.getLatestValue().message).toEqual(message);
      });

      it('should allow setting message to undefined', () => {
        const store = new ImageGalleryStateStore();
        store.message = createMockMessage();

        store.message = undefined;

        expect(store.state.getLatestValue().message).toBeUndefined();
      });
    });

    describe('selectedAttachmentUrl setter', () => {
      it('should update the selected attachment URL in state', () => {
        const store = new ImageGalleryStateStore();
        const url = 'https://example.com/selected.jpg';

        store.selectedAttachmentUrl = url;

        expect(store.state.getLatestValue().selectedAttachmentUrl).toBe(url);
      });

      it('should allow setting URL to undefined', () => {
        const store = new ImageGalleryStateStore();
        store.selectedAttachmentUrl = 'https://example.com/selected.jpg';

        store.selectedAttachmentUrl = undefined;

        expect(store.state.getLatestValue().selectedAttachmentUrl).toBeUndefined();
      });
    });

    describe('currentIndex setter', () => {
      it('should update the current index in state', () => {
        const store = new ImageGalleryStateStore();

        store.currentIndex = 5;

        expect(store.state.getLatestValue().currentIndex).toBe(5);
      });
    });
  });

  describe('openImageGallery', () => {
    it('should set message and selectedAttachmentUrl at once', () => {
      const store = new ImageGalleryStateStore();
      const message = createMockMessage();
      const url = 'https://example.com/image.jpg';

      store.openImageGallery({ message, selectedAttachmentUrl: url });

      const state = store.state.getLatestValue();
      expect(state.message).toEqual(message);
      expect(state.selectedAttachmentUrl).toBe(url);
    });
  });

  describe('subscribeToSelectedAttachmentUrl', () => {
    it('should return an unsubscribe function', () => {
      const store = new ImageGalleryStateStore();

      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('should update currentIndex when selectedAttachmentUrl changes', () => {
      const store = new ImageGalleryStateStore();
      const imageUrl1 = 'https://example.com/image1.jpg';
      const imageUrl2 = 'https://example.com/image2.jpg';
      const message = createMockMessage({ id: 'msg-1' }, [
        createImageAttachment({ image_url: imageUrl1 }),
        createImageAttachment({ image_url: imageUrl2 }),
      ]);

      store.subscribeToSelectedAttachmentUrl();
      store.openImageGallery({ message, selectedAttachmentUrl: imageUrl2 });

      expect(store.state.getLatestValue().currentIndex).toBe(1);
    });

    it('should set currentIndex to 0 when attachment is not found', () => {
      const store = new ImageGalleryStateStore();
      const message = createMockMessage({ id: 'msg-1' }, [
        createImageAttachment({ image_url: 'https://example.com/image1.jpg' }),
      ]);

      store.subscribeToSelectedAttachmentUrl();
      store.openImageGallery({
        message,
        selectedAttachmentUrl: 'https://example.com/not-found.jpg',
      });

      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });

    it('should handle URLs with query parameters when finding index', () => {
      const store = new ImageGalleryStateStore();
      const baseUrl = 'https://example.com/image.jpg';
      const urlWithQuery = 'https://example.com/image.jpg?token=abc123';
      const message = createMockMessage({ id: 'msg-1' }, [
        createImageAttachment({ image_url: baseUrl }),
      ]);

      store.subscribeToSelectedAttachmentUrl();
      store.openImageGallery({ message, selectedAttachmentUrl: urlWithQuery });

      // The stripQueryFromUrl function should match the base URL
      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });

    it('should not update currentIndex when selectedAttachmentUrl is undefined', () => {
      const store = new ImageGalleryStateStore();
      const message = createMockMessage({}, [createImageAttachment()]);

      store.subscribeToSelectedAttachmentUrl();
      store.message = message;

      // currentIndex should remain at initial value (0)
      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });

    it('should not update currentIndex when message is undefined', () => {
      const store = new ImageGalleryStateStore();

      store.subscribeToSelectedAttachmentUrl();
      store.selectedAttachmentUrl = 'https://example.com/image.jpg';

      // currentIndex should remain at initial value (0)
      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });
  });

  describe('registerSubscriptions', () => {
    it('should return an unsubscribe function', () => {
      const store = new ImageGalleryStateStore();

      const unsubscribe = store.registerSubscriptions();

      expect(typeof unsubscribe).toBe('function');
    });

    it('should clear video player pool when unsubscribed', () => {
      const store = new ImageGalleryStateStore();
      const clearSpy = store.videoPlayerPool.clear;

      const unsubscribe = store.registerSubscriptions();
      unsubscribe();

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should set up subscriptions that update currentIndex', () => {
      const store = new ImageGalleryStateStore();
      const imageUrl = 'https://example.com/image.jpg';
      const message = createMockMessage({ id: 'msg-1' }, [
        createImageAttachment({ image_url: imageUrl }),
      ]);

      store.registerSubscriptions();
      store.openImageGallery({ message, selectedAttachmentUrl: imageUrl });

      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset state to initial values', () => {
      const store = new ImageGalleryStateStore();
      const message = createMockMessage();

      store.openImageGallery({
        message,
        selectedAttachmentUrl: 'https://example.com/image.jpg',
      });
      store.currentIndex = 5;

      store.clear();

      const state = store.state.getLatestValue();
      expect(state).toEqual({
        currentIndex: 0,
        message: undefined,
        selectedAttachmentUrl: undefined,
      });
    });

    it('should clear video player pool', () => {
      const store = new ImageGalleryStateStore();
      const clearSpy = store.videoPlayerPool.clear;

      store.clear();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle message with mixed attachment types', () => {
      const store = new ImageGalleryStateStore();
      const attachments: Attachment[] = [
        createImageAttachment({ image_url: 'https://example.com/1.jpg' }),
        { asset_url: 'https://example.com/doc.pdf', type: 'file' }, // Non-viewable
        createVideoAttachment({ asset_url: 'https://example.com/2.mp4' }),
        createImageAttachment({
          image_url: 'https://og.com/preview.jpg',
          og_scrape_url: 'https://og.com',
        }), // URL preview - excluded
        createGiphyAttachment(),
      ];

      store.message = createMockMessage({}, attachments);

      // Should only include image (without og_scrape), video, and giphy
      expect(store.attachments).toHaveLength(3);
      expect(store.assets).toHaveLength(3);
    });

    it('should handle giphy without fixed_height version', () => {
      const store = new ImageGalleryStateStore();
      const giphyAttachment: Attachment = {
        giphy: {} as Attachment['giphy'],
        thumb_url: 'https://giphy.com/thumb.gif',
        type: 'giphy',
      };
      store.message = createMockMessage({ id: 'msg-1' }, [giphyAttachment]);

      const assets = store.assets;

      expect(assets).toHaveLength(1);
      // Should fallback to thumb_url
      expect(assets[0].uri).toBe('https://giphy.com/thumb.gif');
    });

    it('should handle message with empty attachments array', () => {
      const store = new ImageGalleryStateStore();
      store.message = createMockMessage({}, []);

      expect(store.attachments).toEqual([]);
      expect(store.assets).toEqual([]);
    });

    it('should correctly identify asset with asset_url instead of image_url', () => {
      const store = new ImageGalleryStateStore();
      const imageAttachment = createImageAttachment({
        asset_url: 'https://example.com/asset.jpg',
        image_url: undefined,
      });
      store.message = createMockMessage({ id: 'msg-1' }, [imageAttachment]);

      const assets = store.assets;

      expect(assets).toHaveLength(1);
      expect(assets[0].uri).toBe('https://example.com/asset.jpg');
    });
  });
});
