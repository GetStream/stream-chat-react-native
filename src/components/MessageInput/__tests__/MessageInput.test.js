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

describe('MessageInput', () => {
  const clientUser = generateUser();
  let chatClient;
  let channel;

  const getComponent = () => (
    <Chat client={chatClient}>
      <Channel channel={channel}>
        <MessageInput />
      </Channel>
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
    cleanup();
  });

  it('should render MessageInput', async () => {
    await initializeChannel(generateChannel());

    const { getByTestId, queryByTestId, queryByText, toJSON } = render(getComponent());

    await waitFor(() => {
      expect(queryByTestId('upload-photo-item')).toBeTruthy();
      expect(queryByTestId('upload-file-item')).toBeTruthy();
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(queryByTestId('auto-complete-text-input')).toBeTruthy();
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(queryByText('Editing Message')).toBeFalsy();
    });

    fireEvent.press(getByTestId('attach-button'));

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
