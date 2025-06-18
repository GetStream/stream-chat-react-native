import React from 'react';

import { Alert } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import * as AttachmentPickerUtils from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { OverlayProvider } from '../../../contexts/overlayContext/OverlayProvider';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';

import { NativeHandlers } from '../../../native';
import { AttachmentPickerSelectionBar } from '../../AttachmentPicker/components/AttachmentPickerSelectionBar';
import { CameraSelectorIcon } from '../../AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon } from '../../AttachmentPicker/components/FileSelectorIcon';
import { ImageSelectorIcon } from '../../AttachmentPicker/components/ImageSelectorIcon';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { CreatePollIcon } from '../../Poll';
import { MessageInput } from '../MessageInput';

jest.spyOn(Alert, 'alert');
jest.spyOn(AttachmentPickerUtils, 'useAttachmentPickerContext').mockImplementation(
  jest.fn(() => ({
    AttachmentPickerSelectionBar,
    CameraSelectorIcon,
    closePicker: jest.fn(),
    CreatePollIcon,
    FileSelectorIcon,
    ImageSelectorIcon,
    openPicker: jest.fn(),
    selectedPicker: 'images',
    setBottomInset: jest.fn(),
    setSelectedPicker: jest.fn(),
    setTopInset: jest.fn(),
  })),
);

const renderComponent = ({ channelProps, client, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...channelProps}>
          <MessageInput {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('MessageInput', () => {
  let client;
  let channel;

  beforeEach(async () => {
    jest.clearAllMocks();
    cleanup();
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    act(() => {
      channel.messageComposer.clear();
    });
  });

  it('should render MessageInput', async () => {
    const channelProps = { channel };

    renderComponent({
      channelProps,
      client,
      props: {},
    });

    const { getByTestId, queryByTestId, queryByText } = screen;

    act(() => {
      fireEvent.press(getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(queryByTestId('upload-photo-touchable')).toBeTruthy();
      expect(queryByTestId('upload-file-touchable')).toBeTruthy();
      expect(queryByTestId('take-photo-touchable')).toBeTruthy();
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(queryByText('Editing Message')).toBeFalsy();
    });
  });

  it('should start the audio recorder on long press and cleanup on unmount', async () => {
    renderComponent({
      channelProps: { audioRecordingEnabled: true, channel },
      client,
      props: {},
    });

    const { queryByTestId, unmount } = screen;

    const audioButton = queryByTestId('audio-button');

    act(() => {
      fireEvent(audioButton, 'longPress');
    });

    await waitFor(() => {
      expect(NativeHandlers.Audio.startRecording).toHaveBeenCalledTimes(1);
      expect(NativeHandlers.Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).toBeTruthy();
      expect(Alert.alert).not.toHaveBeenCalledWith('Hold to start recording.');
    });

    await act(() => {
      unmount();
    });

    await waitFor(() => {
      expect(NativeHandlers.Audio.stopRecording).toHaveBeenCalledTimes(1);
      // once when starting the recording, once on unmount
      expect(NativeHandlers.Audio.stopPlayer).toHaveBeenCalledTimes(2);
    });
  });

  it('should trigger an alert if a normal press happened on audio recording', async () => {
    renderComponent({
      channelProps: { audioRecordingEnabled: true, channel },
      client,
      props: {},
    });

    const { queryByTestId } = screen;

    const audioButton = queryByTestId('audio-button');

    act(() => {
      fireEvent.press(audioButton);
    });

    await waitFor(() => {
      expect(NativeHandlers.Audio.startRecording).not.toHaveBeenCalled();
      expect(NativeHandlers.Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).not.toBeTruthy();
      // This is sort of a brittle test, but there doesn't seem to be another way
      // to target alerts. The reason why it's here is because we had a bug with it.
      expect(Alert.alert).toHaveBeenCalledWith('Hold to start recording.');
    });
  });
});
