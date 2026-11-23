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

describe('ImageGalleryStateStore video marks', () => {
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

  const playerFor = (index: number) => {
    const asset = store.state.getLatestValue().assets[index];
    const player = store.videoPlayerPool.getOrAddPlayer({
      id: asset.id,
      messageId: asset.messageId,
    });
    player.duration = 10000;
    return player;
  };

  const startPlayback = (index: number) => {
    const player = playerFor(index);
    player.isPlaying = true;
    player.position = 1000;
    return player;
  };

  it('marks the shown video once its playback advances', () => {
    startPlayback(0);

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-1');
  });

  it('marks a video that started next to the shown one on its first progress once shown', () => {
    const neighbour = startPlayback(1);
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();

    store.currentIndex = 1;
    neighbour.position = 2000;

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-2');
  });

  it('marks nothing when the gallery was opened without a channel', () => {
    store.openImageGallery({ messages, selectedAttachmentUrl: 'https://example.com/1.mp4' });

    startPlayback(0);

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
