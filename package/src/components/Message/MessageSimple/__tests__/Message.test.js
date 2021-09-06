import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import { Message } from '../../Message';

import { Chat } from '../../../Chat/Chat';
import { Channel } from '../../../Channel/Channel';
import { MessageInput } from '../../../MessageInput/MessageInput';

import { getOrCreateChannelApi } from '../../../../mock-builders/api/getOrCreateChannel';
import { useMockedApis } from '../../../../mock-builders/api/useMockedApis';
import { generateChannel } from '../../../../mock-builders/generator/channel';
import { generateMember } from '../../../../mock-builders/generator/member';
import { generateMessage } from '../../../../mock-builders/generator/message';
import { generateUser } from '../../../../mock-builders/generator/user';
import { getTestClientWithUser } from '../../../../mock-builders/mock';
import { OverlayProvider } from '../../../../contexts/overlayContext/OverlayProvider';

describe('Message', () => {
  let channel;
  let chatClient;
  let renderMessage;

  const user = generateUser({ id: 'id', name: 'name' });
  const messages = [generateMessage({ user })];

  beforeEach(async () => {
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });

    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);

    renderMessage = (options) =>
      render(
        <OverlayProvider>
          <Chat client={chatClient}>
            <Channel channel={channel}>
              <Message groupStyles={['bottom']} {...options} />
              <MessageInput />
            </Channel>
          </Chat>
          ,
        </OverlayProvider>,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the Message and MessageSimple components', async () => {
    const message = generateMessage({ user });

    const { getByTestId } = renderMessage({ message });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(getByTestId('message-simple-wrapper')).toBeTruthy();
    });
  });

  it('calls the `onLongPressMessage` prop function if it exists', async () => {
    const message = generateMessage({ user });
    const onLongPressMessage = jest.fn();

    const { getByTestId } = renderMessage({
      animatedLongPress: false,
      message,
      onLongPressMessage,
    });

    await waitFor(() => {
      expect(getByTestId('message-wrapper')).toBeTruthy();
      expect(onLongPressMessage).toHaveBeenCalledTimes(0);
    });

    fireEvent(getByTestId('message-content-wrapper'), 'longPress');

    await waitFor(() => {
      expect(onLongPressMessage).toHaveBeenCalledTimes(1);
    });
  });
});
