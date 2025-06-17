import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { CommandsButton } from '../CommandsButton';

const renderComponent = ({ client, channel, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel channel={channel}>
          <CommandsButton {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('CommandsButton', () => {
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
  });

  it('should render component', async () => {
    const props = {};
    renderComponent({ channel, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
    });
  });

  it('should call handleOnPress callback when the button is clicked if passed', async () => {
    const handleOnPress = jest.fn();
    const props = { handleOnPress };

    renderComponent({ channel, client, props });

    const { getByTestId, queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(getByTestId('commands-button'));
    });

    await waitFor(() => {
      expect(handleOnPress).toHaveBeenCalled();
    });
  });
});
