import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from 'mock-builders';

import ActionSheetAttachment from '../ActionSheetAttachment';

import { Chat } from '../../Chat';

describe('ActionSheetAttachment', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = (props = {}) => (
    <Chat client={chatClient}>
      <ActionSheetAttachment {...props} />
    </Chat>
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
  });

  it('should render ActionSheetAttachment and click through items and close icon', async () => {
    const props = {
      closeAttachActionSheet: jest.fn(),
      pickFile: jest.fn(),
      pickImage: jest.fn(),
    };

    await initializeChannel(generateChannel());

    const {
      getAllByTestId,
      getByTestId,
      queryAllByTestId,
      queryByTestId,
      queryByText,
      toJSON,
    } = render(getComponent(props));

    await waitFor(() => {
      expect(queryByTestId('upload-photo-item')).toBeTruthy();
      expect(queryByTestId('upload-file-item')).toBeTruthy();
      expect(queryAllByTestId('icon-square')).toBeTruthy();
      expect(queryByText('Add a file')).toBeTruthy();
      expect(props.closeAttachActionSheet).toHaveBeenCalledTimes(0);
      expect(props.pickFile).toHaveBeenCalledTimes(0);
      expect(props.pickImage).toHaveBeenCalledTimes(0);
    });

    fireEvent.press(getByTestId('upload-photo-item'));

    await waitFor(() => {
      expect(props.closeAttachActionSheet).toHaveBeenCalledTimes(0);
      expect(props.pickFile).toHaveBeenCalledTimes(0);
      expect(props.pickImage).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByTestId('upload-file-item'));

    await waitFor(() => {
      expect(props.closeAttachActionSheet).toHaveBeenCalledTimes(0);
      expect(props.pickFile).toHaveBeenCalledTimes(1);
      expect(props.pickImage).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getAllByTestId('icon-square')[0]);

    await waitFor(() => {
      expect(props.closeAttachActionSheet).toHaveBeenCalledTimes(1);
      expect(props.pickFile).toHaveBeenCalledTimes(1);
      expect(props.pickImage).toHaveBeenCalledTimes(1);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
