import React, { useEffect } from 'react';

import { Alert } from 'react-native';

import { act, cleanup, fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';

import { useMessagesContext } from '../../../contexts';
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
import { NativeHandlers } from '../../../native';
import { AttachmentPickerSelectionBar } from '../../AttachmentPicker/components/AttachmentPickerSelectionBar';
import { CameraSelectorIcon } from '../../AttachmentPicker/components/CameraSelectorIcon';
import { FileSelectorIcon } from '../../AttachmentPicker/components/FileSelectorIcon';
import { ImageSelectorIcon } from '../../AttachmentPicker/components/ImageSelectorIcon';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { CreatePollIcon } from '../../Poll';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
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
      expect(NativeHandlers.Audio.startRecording).toHaveBeenCalledTimes(1);
      expect(NativeHandlers.Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).toBeTruthy();
      expect(Alert.alert).not.toHaveBeenCalledWith('Hold to start recording.');
    });

    unmount();

    await waitFor(() => {
      expect(NativeHandlers.Audio.stopRecording).toHaveBeenCalledTimes(1);
      // once when starting the recording, once on unmount
      expect(NativeHandlers.Audio.stopPlayer).toHaveBeenCalledTimes(2);
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
      expect(NativeHandlers.Audio.startRecording).not.toHaveBeenCalled();
      expect(NativeHandlers.Audio.stopRecording).not.toHaveBeenCalled();
      expect(queryByTestId('recording-active-container')).not.toBeTruthy();
      // This is sort of a brittle test, but there doesn't seem to be another way
      // to target alerts. The reason why it's here is because we had a bug with it.
      expect(Alert.alert).toHaveBeenCalledWith('Hold to start recording.');
    });
  });

  it('should render the SendMessageDisallowedIndicator if the send-message capability is not present', async () => {
    await initializeChannel(generateChannelResponse());

    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });

    act(() => {
      chatClient.dispatchEvent({
        cid: channel.data.cid,
        own_capabilities: channel.data.own_capabilities.filter(
          (capability) => capability !== 'send-message',
        ),
        type: 'capabilities.changed',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeTruthy();
    });
  });

  it('should not render the SendMessageDisallowedIndicator if the channel is frozen and the send-message capability is present', async () => {
    await initializeChannel(generateChannelResponse({ channel: { frozen: true } }));

    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });
  });

  it('should render the SendMessageDisallowedIndicator in a frozen channel only if the send-message capability is not present', async () => {
    await initializeChannel(generateChannelResponse({ channel: { frozen: true } }));

    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <MessageInput />
        </Channel>
      </Chat>,
    );

    act(() => {
      chatClient.dispatchEvent({
        channel: {
          ...channel.data,
          own_capabilities: channel.data.own_capabilities.filter(
            (capability) => capability !== 'send-message',
          ),
        },
        cid: channel.data.cid,
        type: 'channel.updated',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeTruthy();
    });
  });

  const EditingStateMessageInput = () => {
    const { setEditingState } = useMessagesContext();
    useEffect(() => {
      setEditingState({ id: 'some-message-id' });
    }, [setEditingState]);
    return <MessageInput />;
  };

  it('should not render the SendMessageDisallowedIndicator if we are editing a message, regardless of capabilities', async () => {
    await initializeChannel(generateChannelResponse());

    const { queryByTestId } = render(
      <Chat client={chatClient}>
        <Channel audioRecordingEnabled channel={channel}>
          <EditingStateMessageInput />
        </Channel>
      </Chat>,
    );

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });

    act(() => {
      chatClient.dispatchEvent({
        cid: channel.data.cid,
        own_capabilities: channel.data.own_capabilities.filter(
          (capability) => capability !== 'send-message',
        ),
        type: 'capabilities.changed',
      });
    });

    await waitFor(() => {
      expect(queryByTestId('send-message-disallowed-indicator')).toBeNull();
    });
  });
});
