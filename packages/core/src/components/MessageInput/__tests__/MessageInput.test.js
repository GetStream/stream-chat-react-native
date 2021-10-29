import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { MessageInput } from '../MessageInput';

import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';

import { getOrCreateChannelApi } from '../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../mock-builders/generator/channel';
import { generateUser } from '../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../mock-builders/mock';
import { AttachmentPickerProvider } from '../../../contexts/attachmentPickerContext/AttachmentPickerContext';
import { ChannelsStateProvider } from '../../../contexts/channelsStateContext/ChannelsStateContext';

describe('MessageInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = ({ attachmentValue }) => {
    const CameraSelectorIcon = () => null;
    const FileSelectorIcon = () => null;
    const ImageSelectorIcon = () => null;

    return (
      <ChannelsStateProvider>
        <Chat client={chatClient}>
          <AttachmentPickerProvider
            value={{ ...attachmentValue, CameraSelectorIcon, FileSelectorIcon, ImageSelectorIcon }}
          >
            <Channel channel={channel}>
              <MessageInput />
            </Channel>
          </AttachmentPickerProvider>
        </Chat>
      </ChannelsStateProvider>
    );
  };

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
    await initializeChannel(generateChannel());
    const openPicker = jest.fn();
    const closePicker = jest.fn();
    const attachmentValue = { closePicker, openPicker };

    const { getByTestId, queryByTestId, queryByText, toJSON } = render(
      getComponent({ attachmentValue }),
    );

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('attach-button'));

    await waitFor(() => {
      expect(queryByTestId('upload-photo-touchable')).toBeTruthy();
      expect(queryByTestId('upload-file-touchable')).toBeTruthy();
      expect(queryByTestId('take-photo-touchable')).toBeTruthy();
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(queryByText('Editing Message')).toBeFalsy();
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
