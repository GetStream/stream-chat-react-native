import React from 'react';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { ChatConfigProvider, OverlayProvider } from '../../../../contexts';
import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { generateAudioAttachment } from '../../../../mock-builders/attachments';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { AudioPlayer } from '../../../../state-store/audio-player';
import type { HandlePlaybackStarted } from '../../../../types/types';
import { Channel } from '../../../Channel/Channel';
import { Chat } from '../../../Chat/Chat';
import { AudioAttachment, type AudioAttachmentType } from '../AudioAttachment';

jest.mock('../../../../native.ts', () => {
  const View = require('react-native').View;

  return {
    isAudioRecorderAvailable: jest.fn(() => true),
    isDocumentPickerAvailable: jest.fn(() => true),
    isImageMediaLibraryAvailable: jest.fn(() => true),
    isImagePickerAvailable: jest.fn(() => true),
    isNativeMultipartUploadAvailable: jest.fn(() => false),
    isSoundPackageAvailable: jest.fn(() => true),
    NativeHandlers: {
      Sound: {
        Player: View,
      },
    },
  };
});

const voiceRecording = (type: AudioAttachmentType['type'] = 'voiceRecording') =>
  ({
    ...generateAudioAttachment({ type }),
    custom: { duration: 10, waveform_data: [0.1, 0.5, 0.9] },
    id: '0',
    type,
  }) as unknown as AudioAttachmentType;

describe('AudioAttachment played marks', () => {
  let client: StreamChat;
  let channel: ChannelType;
  let playSpy: jest.SpyInstance;

  beforeEach(async () => {
    const result = await initiateClientWithChannels();
    client = result.client;
    channel = result.channels[0];
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
    // The test renderer has no native player, so a press starts playback directly.
    playSpy = jest.spyOn(AudioPlayer.prototype, 'play').mockImplementation(function (
      this: AudioPlayer,
    ) {
      this.state.partialNext({ isPlaying: true });
    });
  });

  // Stands in for the native player's first progress report.
  const advancePlayback = () =>
    act(() => {
      const playingPlayer = playSpy.mock.contexts.at(-1) as AudioPlayer | undefined;
      if (playingPlayer) {
        playingPlayer.position = 1000;
      }
    });

  const sentMessage = () =>
    generateMessage({ user: generateUser({ id: 'other-user' }) }) as LocalMessage;

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  const renderAudio = (
    message: LocalMessage,
    item = voiceRecording(),
    props: { isPreview?: boolean } = {},
    handlePlaybackStarted?: HandlePlaybackStarted,
  ) =>
    render(
      <ChatConfigProvider value={{ handlePlaybackStarted }}>
        <OverlayProvider>
          <Chat client={client}>
            <Channel channel={channel}>
              <AudioAttachment item={item} message={message} {...props} />
            </Channel>
          </Chat>
        </OverlayProvider>
      </ChatConfigProvider>,
    );

  const pressPlay = async () => {
    fireEvent.press(await screen.findByLabelText('Play Pause Button'));
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('marks the voice message played once playback advances', async () => {
    const message = sentMessage();
    renderAudio(message);

    await pressPlay();
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
    advancePlayback();

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith(message.id);
  });

  it('marks an audio file message played once playback advances', async () => {
    const message = sentMessage();
    renderAudio(message, voiceRecording('audio'));

    await pressPlay();
    advancePlayback();

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
  });

  it('does not mark a composer preview', async () => {
    const message = sentMessage();
    renderAudio(message, voiceRecording(), { isPreview: true });

    await pressPlay();
    advancePlayback();

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });

  it('lets the configured handler decide, asking again until it reports the start handled', async () => {
    const message = sentMessage();
    const item = voiceRecording();
    const handlePlaybackStarted = jest.fn().mockReturnValueOnce(false).mockReturnValue(true);
    renderAudio(message, item, {}, handlePlaybackStarted);

    await pressPlay();
    advancePlayback();
    advancePlayback();
    advancePlayback();

    expect(handlePlaybackStarted).toHaveBeenCalledTimes(2);
    expect(handlePlaybackStarted).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attachment: item,
        markPlayed: expect.any(Function),
        message,
        player: playSpy.mock.contexts.at(-1),
      }),
    );
    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
