import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { SendButton } from '../components/OutputButtons/SendButton';

const renderComponent = ({ client, channel, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel channel={channel}>
          <SendButton {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('SendButton', () => {
  let client;
  let channel;

  beforeEach(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();

    act(() => {
      channel.messageComposer.clear();
    });
  });

  it('should render a SendButton', async () => {
    const sendMessage = jest.fn();

    const props = { sendMessage };

    renderComponent({ channel, client, props });

    const { getByTestId, queryByTestId, toJSON } = screen;

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a disabled SendButton', async () => {
    const sendMessage = jest.fn();

    const props = { disabled: true, sendMessage };

    renderComponent({ channel, client, props });

    const { getByTestId, queryByTestId, toJSON } = screen;

    await waitFor(() => {
      expect(queryByTestId('send-button')).toBeTruthy();
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledTimes(0);
    });

    const snapshot = toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });
});
