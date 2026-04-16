import type { Attachment, LocalMessage, UserResponse } from 'stream-chat';

import {
  generateImageAttachment,
  generateVideoAttachment,
} from '../../mock-builders/generator/attachment';
import { generateMessage } from '../../mock-builders/generator/message';
import { getUrlOfImageAttachment } from '../../utils/getUrlOfImageAttachment';
import { ImageGalleryStateStore } from '../image-gallery-state-store';
import { VideoPlayerPool } from '../video-player-pool';

// Mock dependencies
jest.mock('../video-player-pool', () => ({
  VideoPlayerPool: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
    pool: new Map(),
    state: {
      getLatestValue: () => ({ activeVideoPlayer: null }),
    },
  })),
}));

jest.mock('../../native', () => ({
  isVideoPlayerAvailable: jest.fn(() => true),
}));

const { isVideoPlayerAvailable } = jest.requireMock('../../native') as {
  isVideoPlayerAvailable: jest.Mock;
};

const createGiphyAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  giphy: {
    fixed_height: {
      height: 200,
      url: 'https://giphy.com/test.gif',
      width: 200,
    },
  },
  thumb_url: 'https://giphy.com/thumb.gif',
  type: 'giphy',
  ...overrides,
});

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

    it('should merge custom options with defaults', () => {
      const store = new ImageGalleryStateStore({
        autoPlayVideo: true,
        giphyVersion: 'original',
      });

      expect(store.options).toEqual({
        autoPlayVideo: true,
        giphyVersion: 'original',
      });
    });

    it('should partially override options', () => {
      const store = new ImageGalleryStateStore({
        autoPlayVideo: true,
      });

      expect(store.options).toEqual({
        autoPlayVideo: true,
        giphyVersion: 'fixed_height',
      });
    });

    it('should initialize state with default values', () => {
      const store = new ImageGalleryStateStore();
      const state = store.state.getLatestValue();

      expect(state).toEqual({
        assets: [],
        currentIndex: 0,
        messages: [],
        selectedAttachmentUrl: undefined,
      });
    });

    it('should create a VideoPlayerPool instance', () => {
      const store = new ImageGalleryStateStore();

      expect(VideoPlayerPool).toHaveBeenCalled();
      expect(store.videoPlayerPool).toBeDefined();
    });
  });

  describe('messages getter and setter', () => {
    it('should get messages from state', () => {
      const store = new ImageGalleryStateStore();
      const messages = [generateMessage({ id: 1 }), generateMessage({ id: 2 })];

      store.messages = messages;

      expect(store.messages).toEqual(messages);
    });

    it('should update state when setting messages', () => {
      const store = new ImageGalleryStateStore();
      const messages = [generateMessage({ id: 1 })];

      store.messages = messages;

      expect(store.state.getLatestValue().messages).toEqual(messages);
    });

    it('should return empty array when no messages are set', () => {
      const store = new ImageGalleryStateStore();

      expect(store.messages).toEqual([]);
    });
  });

  describe('selectedAttachmentUrl getter and setter', () => {
    it('should get selectedAttachmentUrl from state', () => {
      const store = new ImageGalleryStateStore();
      const url = 'https://example.com/image.jpg';

      store.selectedAttachmentUrl = url;

      expect(store.selectedAttachmentUrl).toBe(url);
    });

    it('should update state when setting selectedAttachmentUrl', () => {
      const store = new ImageGalleryStateStore();
      const url = 'https://example.com/image.jpg';

      store.selectedAttachmentUrl = url;

      expect(store.state.getLatestValue().selectedAttachmentUrl).toBe(url);
    });

    it('should return undefined when no url is set', () => {
      const store = new ImageGalleryStateStore();

      expect(store.selectedAttachmentUrl).toBeUndefined();
    });

    it('should allow setting undefined', () => {
      const store = new ImageGalleryStateStore();
      store.selectedAttachmentUrl = 'https://example.com/image.jpg';

      store.selectedAttachmentUrl = undefined;

      expect(store.selectedAttachmentUrl).toBeUndefined();
    });
  });

  describe('currentIndex setter', () => {
    it('should update currentIndex in state', () => {
      const store = new ImageGalleryStateStore();

      store.currentIndex = 5;

      expect(store.state.getLatestValue().currentIndex).toBe(5);
    });

    it('should allow setting to 0', () => {
      const store = new ImageGalleryStateStore();
      store.currentIndex = 5;

      store.currentIndex = 0;

      expect(store.state.getLatestValue().currentIndex).toBe(0);
    });
  });

  describe('attachmentsWithMessage getter', () => {
    it('should return empty array when no messages', () => {
      const store = new ImageGalleryStateStore();

      expect(store.attachmentsWithMessage).toEqual([]);
    });

    it('should filter messages with viewable image attachments', () => {
      const store = new ImageGalleryStateStore();
      const imageAttachment = generateImageAttachment({
        image_url: 'https://example.com/image.jpg',
      });
      const message = generateMessage({ attachments: [imageAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(1);
      expect(store.attachmentsWithMessage[0].attachments).toContain(imageAttachment);
    });

    it('should filter messages with viewable video attachments', () => {
      const store = new ImageGalleryStateStore();
      const videoAttachment = generateVideoAttachment({
        asset_url: 'https://example.com/video.mp4',
      });
      const message = generateMessage({ attachments: [videoAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(1);
      expect(store.attachmentsWithMessage[0].attachments).toContain(videoAttachment);
    });

    it('should filter messages with giphy attachments', () => {
      const store = new ImageGalleryStateStore();
      const giphyAttachment = createGiphyAttachment();
      const message = generateMessage({ attachments: [giphyAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(1);
      expect(store.attachmentsWithMessage[0].attachments).toContain(giphyAttachment);
    });

    it('should exclude video attachments when video player is not available', () => {
      (isVideoPlayerAvailable as jest.Mock).mockReturnValue(false);
      const store = new ImageGalleryStateStore();
      const videoAttachment = generateVideoAttachment({
        asset_url: 'https://example.com/video.mp4',
      });
      const message = generateMessage({ attachments: [videoAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });

    it('should exclude image attachments with title_link (link previews)', () => {
      const store = new ImageGalleryStateStore();
      const linkPreviewAttachment = generateImageAttachment({
        image_url: 'https://example.com/image.jpg',
        title_link: 'https://example.com',
      });
      const message = generateMessage({ attachments: [linkPreviewAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });

    it('should exclude image attachments with og_scrape_url (OpenGraph previews)', () => {
      const store = new ImageGalleryStateStore();
      const linkAttachment = generateImageAttachment({
        image_url: 'https://example.com/image.jpg',
        og_scrape_url: 'https://example.com',
      });
      const message = generateMessage({ attachments: [linkAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });

    it('should handle messages with mixed viewable and non-viewable attachments', () => {
      const store = new ImageGalleryStateStore();
      const viewableImage = generateImageAttachment({ image_url: 'https://example.com/image.jpg' });
      const linkPreview = generateImageAttachment({
        image_url: 'https://example.com/preview.jpg',
        title_link: 'https://example.com',
      });
      const message = generateMessage({ attachments: [viewableImage, linkPreview], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(1);
    });

    it('should exclude messages with only non-viewable attachments', () => {
      const store = new ImageGalleryStateStore();
      const fileAttachment: Attachment = {
        asset_url: 'https://example.com/file.pdf',
        type: 'file',
      };
      const message = generateMessage({ attachments: [fileAttachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });

    it('should handle null attachments gracefully', () => {
      const store = new ImageGalleryStateStore();
      const message = generateMessage({ attachments: [null as unknown as Attachment], id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });

    it('should handle messages without attachments array', () => {
      const store = new ImageGalleryStateStore();
      const message = generateMessage({ attachments: undefined, id: 1 });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
    });
  });

  describe('getAssetId', () => {
    it('should generate unique asset id from messageId and assetUrl', () => {
      const store = new ImageGalleryStateStore();
      const assetId = store.getAssetId('message-123', 'https://example.com/image.jpg');

      expect(assetId).toBe('photoId-message-123-https://example.com/image.jpg');
    });

    it('should handle empty messageId', () => {
      const store = new ImageGalleryStateStore();
      const assetId = store.getAssetId('', 'https://example.com/image.jpg');

      expect(assetId).toBe('photoId--https://example.com/image.jpg');
    });
  });

  describe('assets getter', () => {
    it('should return empty array when no messages', () => {
      const store = new ImageGalleryStateStore();

      expect(store.assets).toEqual([]);
    });

    it('should transform image attachments to assets', () => {
      const store = new ImageGalleryStateStore();
      const imageAttachment = generateImageAttachment({
        image_url: 'https://example.com/image.jpg',
        original_height: 600,
        original_width: 800,
        thumb_url: 'https://example.com/thumb.jpg',
      });
      const user: Partial<UserResponse> = { id: 'user-1', name: 'Test User' };
      const message = generateMessage({
        attachments: [imageAttachment],
        cid: 'channel-msg-1',
        id: 'msg-1',
        user,
        user_id: user.id,
      });

      store.messages = [message];

      const assets = store.assets;
      expect(assets).toHaveLength(1);
      expect(assets[0]).toMatchObject({
        channelId: 'channel-msg-1',
        messageId: 'msg-1',
        mime_type: undefined,
        original_height: 600,
        original_width: 800,
        thumb_url: 'https://example.com/thumb.jpg',
        type: 'image',
        uri: 'https://example.com/image.jpg',
        user_id: 'user-1',
      });
    });

    it('should transform video attachments to assets', () => {
      const store = new ImageGalleryStateStore();
      const videoAttachment = generateVideoAttachment({
        asset_url: 'https://example.com/video.mp4',
        thumb_url: 'https://example.com/video-thumb.jpg',
      });
      const message = generateMessage({ attachments: [videoAttachment], id: 1 });

      store.messages = [message];

      const assets = store.assets;
      expect(assets).toHaveLength(1);
      expect(assets[0]).toMatchObject({
        mime_type: 'video/mp4',
        type: 'video',
        uri: 'https://example.com/video.mp4',
      });
    });

    it('should transform giphy attachments with correct mime type', () => {
      const store = new ImageGalleryStateStore();
      const giphyAttachment = createGiphyAttachment();
      const message = generateMessage({ attachments: [giphyAttachment], id: 1 });

      store.messages = [message];

      const assets = store.assets;
      expect(assets).toHaveLength(1);
      expect(assets[0]).toMatchObject({
        mime_type: 'image/gif',
        type: 'giphy',
        uri: 'https://giphy.com/test.gif',
      });
    });

    it('should generate unique asset ids for each attachment', () => {
      const store = new ImageGalleryStateStore();
      const attachment1 = generateImageAttachment({ image_url: 'https://example.com/image1.jpg' });
      const attachment2 = generateImageAttachment({ image_url: 'https://example.com/image2.jpg' });
      const message = generateMessage({ attachments: [attachment1, attachment2], id: 1 });

      store.messages = [message];

      const assets = store.assets;
      expect(assets).toHaveLength(2);
      expect(assets[0].id).not.toBe(assets[1].id);
    });

    it('should use custom giphyVersion from options', () => {
      const store = new ImageGalleryStateStore({ giphyVersion: 'original' });
      const giphyAttachment: Attachment = {
        giphy: {
          fixed_height: { height: 200, url: 'https://giphy.com/fixed.gif', width: 200 },
          original: { height: 400, url: 'https://giphy.com/original.gif', width: 400 },
        },
        type: 'giphy',
      };
      const message = generateMessage({ attachments: [giphyAttachment], id: 1 });

      store.messages = [message];

      expect(getUrlOfImageAttachment(giphyAttachment, 'original')).toBe(
        'https://giphy.com/original.gif',
      );
    });

    it('should handle messages with multiple attachments', () => {
      const store = new ImageGalleryStateStore();
      const message1 = generateMessage({
        attachments: [
          generateImageAttachment({ image_url: 'https://example.com/image1.jpg' }),
          generateImageAttachment({ image_url: 'https://example.com/image2.jpg' }),
        ],
        id: 1,
      });
      const message2 = generateMessage({
        attachments: [generateVideoAttachment({ asset_url: 'https://example.com/video.mp4' })],
        id: 2,
      });

      store.messages = [message1, message2];

      expect(store.assets).toHaveLength(3);
    });
  });

  describe('appendMessages', () => {
    it('should append messages to existing messages', () => {
      const store = new ImageGalleryStateStore();
      const initialMessages = [generateMessage({ id: 'msg-1' })];
      const newMessages = [generateMessage({ id: 'msg-2' }), generateMessage({ id: 'msg-3' })];

      store.messages = initialMessages;
      store.appendMessages(newMessages);

      expect(store.messages).toHaveLength(3);
      expect(store.messages).toEqual([...initialMessages, ...newMessages]);
    });

    it('should work with empty initial messages', () => {
      const store = new ImageGalleryStateStore();
      const newMessages = [generateMessage({ id: 'msg-1' })];

      store.appendMessages(newMessages);

      expect(store.messages).toEqual(newMessages);
    });

    it('should work with empty new messages', () => {
      const store = new ImageGalleryStateStore();
      const initialMessages = [generateMessage({ id: 'msg-1' })];

      store.messages = initialMessages;
      store.appendMessages([]);

      expect(store.messages).toEqual(initialMessages);
    });
  });

  describe('removeMessages', () => {
    it('should remove specified messages', () => {
      const store = new ImageGalleryStateStore();
      const message1 = generateMessage({ id: 'msg-1' });
      const message2 = generateMessage({ id: 'msg-2' });
      const message3 = generateMessage({ id: 'msg-3' });

      store.messages = [message1, message2, message3];
      store.removeMessages([message2]);

      expect(store.messages).toHaveLength(2);
      expect(store.messages).toEqual([message1, message3]);
    });

    it('should remove multiple messages', () => {
      const store = new ImageGalleryStateStore();
      const message1 = generateMessage({ id: 'msg-1' });
      const message2 = generateMessage({ id: 'msg-2' });
      const message3 = generateMessage({ id: 'msg-3' });

      store.messages = [message1, message2, message3];
      store.removeMessages([message1, message3]);

      expect(store.messages).toHaveLength(1);
      expect(store.messages).toEqual([message2]);
    });

    it('should handle removing non-existent messages', () => {
      const store = new ImageGalleryStateStore();
      const message1 = generateMessage({ id: 'msg-1' });
      const message2 = generateMessage({ id: 'msg-2' });
      const nonExistentMessage = generateMessage({ id: 'non-existent' });

      store.messages = [message1, message2];
      store.removeMessages([nonExistentMessage]);

      expect(store.messages).toHaveLength(2);
      expect(store.messages).toEqual([message1, message2]);
    });

    it('should handle empty removal array', () => {
      const store = new ImageGalleryStateStore();
      const message1 = generateMessage({ id: 'msg-1' });

      store.messages = [message1];
      store.removeMessages([]);

      expect(store.messages).toEqual([message1]);
    });
  });

  describe('openImageGallery', () => {
    it('should set messages and selectedAttachmentUrl', () => {
      const store = new ImageGalleryStateStore();
      const messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
      ];
      const selectedUrl = 'https://example.com/1.jpg';

      store.openImageGallery({ messages, selectedAttachmentUrl: selectedUrl });

      expect(store.messages).toEqual(messages);
      expect(store.selectedAttachmentUrl).toBe(selectedUrl);
    });

    it('should work without selectedAttachmentUrl', () => {
      const store = new ImageGalleryStateStore();
      const messages = [generateMessage({ id: 'msg-1' })];

      store.openImageGallery({ messages });

      expect(store.messages).toEqual(messages);
      expect(store.selectedAttachmentUrl).toBeUndefined();
    });

    it('should replace existing messages', () => {
      const store = new ImageGalleryStateStore();
      const oldMessages = [generateMessage({ id: 'msg-1' })];
      const newMessages = [generateMessage({ id: 'msg-2' })];

      store.messages = oldMessages;
      store.openImageGallery({ messages: newMessages });

      expect(store.messages).toEqual(newMessages);
    });
  });

  describe('subscribeToMessages', () => {
    it('should update assets when messages change', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.subscribeToMessages();

      const message = generateMessage({
        attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
        id: 'msg-1',
      });
      store.messages = [message];

      expect(store.state.getLatestValue().assets).toHaveLength(1);

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.subscribeToMessages();

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('should recalculate assets when messages are appended', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.subscribeToMessages();

      store.messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
      ];
      expect(store.state.getLatestValue().assets).toHaveLength(1);

      store.appendMessages([
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/2.jpg' })],
          id: 'msg-2',
        }),
      ]);
      expect(store.state.getLatestValue().assets).toHaveLength(2);

      unsubscribe();
    });
  });

  describe('subscribeToSelectedAttachmentUrl', () => {
    it('should update currentIndex when selectedAttachmentUrl matches an asset', () => {
      const store = new ImageGalleryStateStore();
      store.subscribeToMessages();
      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      const messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/2.jpg' })],
          id: 'msg-2',
        }),
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/3.jpg' })],
          id: 'msg-3',
        }),
      ];

      store.messages = messages;
      store.selectedAttachmentUrl = 'https://example.com/2.jpg';

      expect(store.state.getLatestValue().currentIndex).toBe(1);

      unsubscribe();
    });

    it('should set currentIndex to 0 when selectedAttachmentUrl is not found', () => {
      const store = new ImageGalleryStateStore();
      store.subscribeToMessages();
      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      store.messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
      ];
      store.selectedAttachmentUrl = 'https://example.com/non-existent.jpg';

      expect(store.state.getLatestValue().currentIndex).toBe(0);

      unsubscribe();
    });

    it('should not update currentIndex when selectedAttachmentUrl is undefined', () => {
      const store = new ImageGalleryStateStore();
      store.currentIndex = 5;
      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      store.selectedAttachmentUrl = undefined;

      expect(store.state.getLatestValue().currentIndex).toBe(5);

      unsubscribe();
    });

    it('should strip query params when matching URLs', () => {
      const store = new ImageGalleryStateStore();
      store.subscribeToMessages();
      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      store.messages = [
        generateMessage({
          attachments: [
            generateImageAttachment({ image_url: 'https://example.com/image.jpg?size=small' }),
          ],
          id: 'msg-1',
        }),
      ];
      store.selectedAttachmentUrl = 'https://example.com/image.jpg?size=large';

      expect(store.state.getLatestValue().currentIndex).toBe(0);

      unsubscribe();
    });

    it('should return unsubscribe function', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.subscribeToSelectedAttachmentUrl();

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('registerSubscriptions', () => {
    it('should register both message and selectedAttachmentUrl subscriptions', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.registerSubscriptions();

      // Test that message subscription is working
      store.messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
      ];
      expect(store.state.getLatestValue().assets).toHaveLength(1);

      // Test that selectedAttachmentUrl subscription is working
      store.selectedAttachmentUrl = 'https://example.com/1.jpg';
      expect(store.state.getLatestValue().currentIndex).toBe(0);

      unsubscribe();
    });

    it('should return unsubscribe function that cleans up all subscriptions', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.registerSubscriptions();

      expect(typeof unsubscribe).toBe('function');

      unsubscribe();

      // Verify videoPlayerPool.clear was called
      expect(store.videoPlayerPool.clear).toHaveBeenCalled();
    });

    it('should clear videoPlayerPool when unsubscribing', () => {
      const store = new ImageGalleryStateStore();
      const unsubscribe = store.registerSubscriptions();

      unsubscribe();

      expect(store.videoPlayerPool.clear).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should reset state to initial values', () => {
      const store = new ImageGalleryStateStore();
      store.messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
      ];
      store.selectedAttachmentUrl = 'https://example.com/1.jpg';
      store.currentIndex = 5;

      store.clear();

      const state = store.state.getLatestValue();
      expect(state.assets).toEqual([]);
      expect(state.currentIndex).toBe(0);
      expect(state.messages).toEqual([]);
      expect(state.selectedAttachmentUrl).toBeUndefined();
    });

    it('should clear videoPlayerPool', () => {
      const store = new ImageGalleryStateStore();

      store.clear();

      expect(store.videoPlayerPool.clear).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle message with undefined user', () => {
      const store = new ImageGalleryStateStore();
      const message = {
        ...generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/1.jpg' })],
          id: 'msg-1',
        }),
        user: undefined,
      } as LocalMessage;

      store.messages = [message];

      expect(store.assets).toHaveLength(1);
      expect(store.assets[0].user).toBeUndefined();
    });

    it('should handle multiple stores independently', () => {
      const store1 = new ImageGalleryStateStore({ autoPlayVideo: true });
      const store2 = new ImageGalleryStateStore({ autoPlayVideo: false });

      store1.messages = [generateMessage({ id: 'msg-1' })];
      store2.messages = [generateMessage({ id: 'msg-2' }), generateMessage({ id: 'msg-3' })];

      expect(store1.messages).toHaveLength(1);
      expect(store2.messages).toHaveLength(2);
      expect(store1.options.autoPlayVideo).toBe(true);
      expect(store2.options.autoPlayVideo).toBe(false);
    });

    it('should handle rapid state updates', () => {
      const store = new ImageGalleryStateStore();
      store.subscribeToMessages();

      for (let i = 0; i < 100; i++) {
        store.messages = [
          generateMessage({
            attachments: [
              generateImageAttachment({ image_url: `https://example.com/image-${i}.jpg` }),
            ],
            id: `msg-${i}`,
          }),
        ];
      }

      expect(store.state.getLatestValue().assets).toHaveLength(1);
      expect(store.messages).toHaveLength(1);
    });

    it('should handle empty attachment arrays in messages', () => {
      const store = new ImageGalleryStateStore();
      const message = generateMessage({ attachments: [], id: 'msg-1' });

      store.messages = [message];

      expect(store.attachmentsWithMessage).toHaveLength(0);
      expect(store.assets).toEqual([]);
    });

    it('should maintain order of assets based on message order', () => {
      const store = new ImageGalleryStateStore();
      const messages = [
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/first.jpg' })],
          id: 'msg-1',
        }),
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/second.jpg' })],
          id: 'msg-2',
        }),
        generateMessage({
          attachments: [generateImageAttachment({ image_url: 'https://example.com/third.jpg' })],
          id: 'msg-3',
        }),
      ];

      store.messages = messages;

      const assets = store.assets;
      expect(assets[0].uri).toBe('https://example.com/first.jpg');
      expect(assets[1].uri).toBe('https://example.com/second.jpg');
      expect(assets[2].uri).toBe('https://example.com/third.jpg');
    });
  });

  describe('state reactivity', () => {
    it('should notify subscribers when messages change', () => {
      const store = new ImageGalleryStateStore();
      const callback = jest.fn();

      store.state.subscribeWithSelector(
        (state) => ({ messages: state.messages }),
        ({ messages }) => callback(messages),
      );

      const newMessages = [generateMessage({ id: 'msg-1' })];
      store.messages = newMessages;

      expect(callback).toHaveBeenCalledWith(newMessages);
    });

    it('should notify subscribers when selectedAttachmentUrl changes', () => {
      const store = new ImageGalleryStateStore();
      const callback = jest.fn();

      store.state.subscribeWithSelector(
        (state) => ({ selectedAttachmentUrl: state.selectedAttachmentUrl }),
        ({ selectedAttachmentUrl }) => callback(selectedAttachmentUrl),
      );

      store.selectedAttachmentUrl = 'https://example.com/image.jpg';

      expect(callback).toHaveBeenCalledWith('https://example.com/image.jpg');
    });

    it('should notify subscribers when currentIndex changes', () => {
      const store = new ImageGalleryStateStore();
      const callback = jest.fn();

      store.state.subscribeWithSelector(
        (state) => ({ currentIndex: state.currentIndex }),
        ({ currentIndex }) => callback(currentIndex),
      );

      store.currentIndex = 3;

      expect(callback).toHaveBeenCalledWith(3);
    });
  });
});
