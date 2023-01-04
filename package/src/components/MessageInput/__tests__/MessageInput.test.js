import React from 'react';

import { Alert } from 'react-native';

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

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
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { MessageInput } from '../MessageInput';

describe('MessageInput', () => {
  jest.spyOn(Alert, 'alert');
  jest.spyOn(AttachmentPickerUtils, 'useAttachmentPickerContext').mockImplementation(
    jest.fn(() => ({
      closePicker: jest.fn(),
      openPicker: jest.fn(),
      selectedFiles: [
        generateFileAttachment({ name: 'Dummy.png', size: 20000000 }),
        generateFileAttachment({ name: 'Dummy.png', size: 20000000 }),
      ],
      selectedImages: [
        generateImageAttachment({
          file: { height: 100, uri: 'https://picsum.photos/200/300', width: 100 },
          fileSize: 10000001,
          uri: 'https://picsum.photos/200/300',
        }),
        generateImageAttachment({
          file: { height: 100, uri: 'https://picsum.photos/200/300', width: 100 },
          fileSize: 10000001,
          uri: 'https://picsum.photos/200/300',
        }),
      ],
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

    const { getByTestId, queryByTestId, queryByText } = render(getComponent());

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('attach-button'));

    await waitFor(() => {
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(queryByText('Editing Message')).toBeFalsy();
    });
  });

  it('trigger file size threshold limit alert when images size above the limit', async () => {
    await initializeChannel(generateChannelResponse());

    const initialProps = {
      maxFileSizeToUploadInMb: 1,
    };

    render(
      <OverlayProvider>
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <MessageInput {...initialProps} />
          </Channel>
        </Chat>
      </OverlayProvider>,
    );

    // Both for files and for images triggered in one test itself.
    expect(Alert.alert).toHaveBeenCalledTimes(2);
  });
});
