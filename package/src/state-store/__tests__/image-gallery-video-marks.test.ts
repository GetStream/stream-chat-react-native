import type { Channel, LocalMessage } from 'stream-chat';

import { initiateClientWithChannels } from '../../mock-builders/api/initiateClientWithChannels';
import { generateVideoAttachment } from '../../mock-builders/generator/attachment';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateUser } from '../../mock-builders/generator/user';
import { ImageGalleryStateStore } from '../image-gallery-state-store';

jest.mock('../../native', () => ({
  isVideoPlayerAvailable: jest.fn(() => true),
  NativeHandlers: { SDK: '' },
}));

describe('ImageGalleryStateStore.markPlayedIfShown', () => {
  let channel: Channel;
  let messages: LocalMessage[];
  let store: ImageGalleryStateStore;
  let unsubscribe: () => void;

  beforeEach(async () => {
    const { channels } = await initiateClientWithChannels();
    channel = channels[0];
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
    const user = generateUser({ id: 'other-user' });
    messages = [1, 2].map(
      (n) =>
        generateMessage({
          attachments: [generateVideoAttachment({ asset_url: `https://example.com/${n}.mp4` })],
          id: `video-message-${n}`,
          user,
        }) as LocalMessage,
    );
    store = new ImageGalleryStateStore();
    unsubscribe = store.registerSubscriptions();
    store.openImageGallery({
      channel,
      messages,
      selectedAttachmentUrl: 'https://example.com/1.mp4',
    });
  });

  afterEach(() => {
    unsubscribe();
    jest.restoreAllMocks();
  });

  const assetAt = (index: number) => store.state.getLatestValue().assets[index];

  it('marks the shown video and reports it handled', () => {
    const asset = assetAt(0);

    expect(store.markPlayedIfShown(asset.id, asset.messageId)).toBe(true);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-1');
  });

  it('leaves a video that is not shown unhandled until its slide is shown', () => {
    const asset = assetAt(1);

    expect(store.markPlayedIfShown(asset.id, asset.messageId)).toBe(false);
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();

    store.currentIndex = 1;

    expect(store.markPlayedIfShown(asset.id, asset.messageId)).toBe(true);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-2');
  });

  it('marks nothing when the gallery was opened without a channel', () => {
    store.openImageGallery({ messages, selectedAttachmentUrl: 'https://example.com/1.mp4' });
    const asset = assetAt(0);

    store.markPlayedIfShown(asset.id, asset.messageId);

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
