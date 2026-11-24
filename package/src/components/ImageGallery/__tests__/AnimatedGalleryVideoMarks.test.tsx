import React from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { act, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel, LocalMessage } from 'stream-chat';

import { ChatConfigProvider } from '../../../contexts/chatConfigContext/ChatConfigContext';
import {
  ImageGalleryContext,
  ImageGalleryContextValue,
} from '../../../contexts/imageGalleryContext/ImageGalleryContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateVideoAttachment } from '../../../mock-builders/generator/attachment';
import { generateMessage } from '../../../mock-builders/generator/message';
import { generateUser } from '../../../mock-builders/generator/user';
import { ImageGalleryStateStore } from '../../../state-store/image-gallery-state-store';
import type { HandlePlaybackStarted } from '../../../types/types';
import { ImageGallery } from '../ImageGallery';

jest.mock('../../../native.ts', () => {
  const { View } = require('react-native');
  return {
    isFileSystemAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isShareImageAvailable: jest.fn(() => true),
    isVideoPlayerAvailable: jest.fn(() => true),
    NativeHandlers: {
      Video: View,
    },
  };
});

describe('AnimatedGalleryVideo playback start', () => {
  let channel: Channel;
  let messages: LocalMessage[];
  let store: ImageGalleryStateStore;
  let unsubscribe: () => void;

  beforeEach(async () => {
    ({
      channels: [channel],
    } = await initiateClientWithChannels());
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
    const user = generateUser({ id: 'other-user' });
    messages = [1, 2].map(
      (n) =>
        generateMessage({
          attachments: [
            generateVideoAttachment({ asset_url: `https://example.com/${n}.mp4`, type: 'video' }),
          ],
          cid: channel.cid,
          id: `video-message-${n}`,
          user,
        }) as LocalMessage,
    );
    store = new ImageGalleryStateStore();
    unsubscribe = store.registerSubscriptions();
  });

  afterEach(() => {
    // Clearing the player pool updates the mounted gallery.
    act(() => unsubscribe());
    jest.restoreAllMocks();
  });

  const openGallery = async ({
    handlePlaybackStarted,
    withChannel = true,
  }: { handlePlaybackStarted?: HandlePlaybackStarted; withChannel?: boolean } = {}) => {
    store.openImageGallery({
      channel: withChannel ? channel : undefined,
      messages,
      selectedAttachmentUrl: 'https://example.com/1.mp4',
    });
    render(
      <ChatConfigProvider value={{ handlePlaybackStarted }}>
        <OverlayProvider value={{ overlayOpacity: { value: 1 } as SharedValue<number> }}>
          <ImageGalleryContext.Provider
            value={{ imageGalleryStateStore: store } as unknown as ImageGalleryContextValue}
          >
            <ImageGallery />
          </ImageGalleryContext.Provider>
        </OverlayProvider>
      </ChatConfigProvider>,
    );
    await waitFor(() =>
      expect(
        screen.queryAllByLabelText('Image Gallery Video', { includeHiddenElements: true }),
      ).toHaveLength(2),
    );
  };

  const playerAt = (index: number) => {
    const asset = store.state.getLatestValue().assets[index];
    const player = store.videoPlayerPool.pool.get(asset.id);
    if (!player) {
      throw new Error(`No video player for slide ${index}`);
    }
    return player;
  };

  // Stands in for the native player's progress report.
  const advancePlayback = (index: number) =>
    act(() => {
      const player = playerAt(index);
      player.duration = 10000;
      player.isPlaying = true;
      player.position = 1000;
    });

  it('marks the shown video once playback advances', async () => {
    await openGallery();

    advancePlayback(0);

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-1');
  });

  it('marks a video playing next to the shown one only once its slide is shown', async () => {
    await openGallery();

    advancePlayback(1);
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();

    act(() => {
      store.currentIndex = 1;
    });
    advancePlayback(1);

    expect(channel.markMessagePlayed).toHaveBeenCalledWith('video-message-2');
  });

  it('lets the configured handler decide, asking again until it reports the start handled', async () => {
    const handlePlaybackStarted = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
    await openGallery({ handlePlaybackStarted });

    advancePlayback(0);
    advancePlayback(0);
    advancePlayback(0);

    expect(handlePlaybackStarted).toHaveBeenCalledTimes(2);
    expect(handlePlaybackStarted).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attachment: messages[0].attachments?.[0],
        markPlayed: expect.any(Function),
        message: messages[0],
        player: playerAt(0),
      }),
    );
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });

  it('marks nothing when the gallery was opened without a channel', async () => {
    await openGallery({ withChannel: false });

    advancePlayback(0);

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
