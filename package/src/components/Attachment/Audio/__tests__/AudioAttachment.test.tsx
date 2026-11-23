import React from 'react';

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import type { Channel as ChannelType, LocalMessage, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../../contexts';
import { initiateClientWithChannels } from '../../../../mock-builders/api/initiateClientWithChannels';
import { generateAudioAttachment } from '../../../../mock-builders/attachments';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { AudioPlayer } from '../../../../state-store/audio-player';
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

  beforeEach(async () => {
    const result = await initiateClientWithChannels();
    client = result.client;
    channel = result.channels[0];
    jest.spyOn(channel, 'markMessagePlayed').mockResolvedValue(null);
    // The test renderer has no native player, so a press starts playback directly.
    jest.spyOn(AudioPlayer.prototype, 'play').mockImplementation(function (this: AudioPlayer) {
      this.state.partialNext({ isPlaying: true });
    });
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  const renderAudio = (
    message: LocalMessage,
    item = voiceRecording(),
    props: { isPreview?: boolean } = {},
  ) =>
    render(
      <OverlayProvider>
        <Chat client={client}>
          <Channel channel={channel}>
            <AudioAttachment item={item} message={message} {...props} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

  const pressPlay = async () => {
    fireEvent.press(await screen.findByLabelText('Play Pause Button'));
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('marks the voice message played when playback starts', async () => {
    const message = generateMessage({ user: generateUser({ id: 'other-user' }) }) as LocalMessage;
    renderAudio(message);

    await pressPlay();

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith(message);
  });

  it('marks an audio file message played when playback starts', async () => {
    const message = generateMessage({ user: generateUser({ id: 'other-user' }) }) as LocalMessage;
    renderAudio(message, voiceRecording('audio'));

    await pressPlay();

    expect(channel.markMessagePlayed).toHaveBeenCalledTimes(1);
    expect(channel.markMessagePlayed).toHaveBeenCalledWith(message);
  });

  it('does not mark a composer preview', async () => {
    const message = generateMessage({ user: generateUser({ id: 'other-user' }) }) as LocalMessage;
    renderAudio(message, voiceRecording(), { isPreview: true });

    await pressPlay();

    expect(channel.markMessagePlayed).not.toHaveBeenCalled();
  });
});
