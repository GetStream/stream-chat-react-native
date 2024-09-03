import React from 'react';

import { Alert } from 'react-native';

import { cleanup, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';

import * as AttachmentPickerUtils from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';
import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';

import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import {
  generateFileAttachment,
  generateImageAttachment,
} from '../../../mock-builders/generator/attachment';
import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { Audio } from '../../../native';
import { AttachmentPickerSelectionBar } from '../../AttachmentPicker/components/AttachmentPickerSelectionBar';
import { CameraSelectorIcon } from '../../AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon } from '../../AttachmentPicker/components/FileSelectorIcon';
import { ImageSelectorIcon } from '../../AttachmentPicker/components/ImageSelectorIcon';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  jest.spyOn(Alert, 'alert');
  jest.spyOn(AttachmentPickerUtils, 'useAttachmentPickerContext').mockImplementation(
    jest.fn(() => ({
      AttachmentPickerSelectionBar,
      CameraSelectorIcon,
      closePicker: jest.fn(),
      FileSelectorIcon,
      ImageSelectorIcon,
      openPicker: jest.fn(),
      selectedFiles: [
        generateFileAttachment({ name: 'Dummy.pdf', size: 500000000 }),
        generateFileAttachment({ name: 'Dummy.pdf', size: 600000000 }),
      ],
      selectedImages: [
        generateImageAttachment({
          file: { height: 100, uri: 'https://picsum.photos/200/300', width: 100 },
          size: 500000000,
          uri: 'https://picsum.photos/200/300',
        }),
        generateImageAttachment({
          file: { height: 100, uri: 'https://picsum.photos/200/300', width: 100 },
          size: 600000000,
          uri: 'https://picsum.photos/200/300',
        }),
      ],
      selectedPicker: 'images',
      setBottomInset: jest.fn(),
      setMaxNumberOfFiles: jest.fn(),
      setSelectedFiles: jest.fn(),
      setSelectedImages: jest.fn(),
      setSelectedPicker: jest.fn(),
      setTopInset: jest.fn(),
    })),
  );

  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = () => (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>
    </OverlayProvider>
  );

  const initializeChannel = async (c) => {
    useMockedApis(chatClient, [getOrCreateChannelApi(c)]);

    channel = chatClient.channel('messaging');

    await channel.watch();
  };

  beforeEach(async () => {
    chatClient = await getTestClientWithUser(clientUser);
  });

  afterEach(() => {
    channel = null;
    cleanup();
  });

  it('should render MessageInput', async () => {
    await initializeChannel(generateChannelResponse());

    const openPicker = jest.fn();
    const closePicker = jest.fn();
    const attachmentValue = { closePicker, openPicker };

    const { getByTestId, queryByTestId, queryByText } = render(getComponent({ attachmentValue }));

    fireEvent.press(getByTestId('attach-button'));

    await waitFor(() => {
      expect(queryByTestId('upload-photo-touchable')).toBeTruthy();
      expect(queryByTestId('upload-file-touchable')).toBeTruthy();
      expect(queryByTestId('take-photo-touchable')).toBeTruthy();
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(queryByText('Editing Message')).toBeFalsy();
    });
  });

  it('trigger file size threshold limit alert when images size above the limit', async () => {
    await initializeChannel(generateChannelResponse());

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageInput />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    // Both for files and for images triggered in one test itself.
    expect(Alert.alert).toHaveBeenCalledTimes(4);
  });

  it('should start the audio recorder on long press and cleanup on unmount', async () => {
    jest.clearAllMocks();

    await initializeChannel(generateChannelResponse());
    const userBot = userEvent.setup();

    const { queryByTestId, unmount } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>,
    );

    await userBot.longPress(queryByTestId('audio-button'), { duration: 1000 });

    await waitFor(() => {
      expect(Audio.startRecording).toHaveBeenCalledTimes(1);
      expect(Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).toBeTruthy();
      expect(Alert.alert).not.toHaveBeenCalledWith('Hold to start recording.');
    });

    unmount();

    await waitFor(() => {
      expect(Audio.stopRecording).toHaveBeenCalledTimes(1);
      // once when starting the recording, once on unmount
      expect(Audio.stopPlayer).toHaveBeenCalledTimes(2);
    });
  });

  it('should trigger an alert if a normal press happened on audio recording', async () => {
    jest.clearAllMocks();

    await initializeChannel(generateChannelResponse());
    const userBot = userEvent.setup();

    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>,
    );

    await userBot.press(queryByTestId('audio-button'));

    await waitFor(() => {
      expect(Audio.startRecording).not.toHaveBeenCalled();
      expect(Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).not.toBeTruthy();
      // This is sort of a brittle test, but there doesn't seem to be another way
      // to target alerts. The reason why it's here is because we had a bug with it.
      expect(Alert.alert).toHaveBeenCalledWith('Hold to start recording.');
    });
  });
});
