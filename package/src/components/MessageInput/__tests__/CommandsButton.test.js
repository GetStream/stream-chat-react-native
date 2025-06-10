import React from 'react';

import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';

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

  beforeAll(async () => {
    const { client: chatClient, channels } = await initiateClientWithChannels();
    client = chatClient;
    channel = channels[0];
  });

  it('should not render component when hasText is true', async () => {
    const props = { hasText: true };
    renderComponent({ channel, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeFalsy();
    });
  });

  it('should render component when hasText is false', async () => {
    const props = { hasText: false };
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

    await act(() => {
      userEvent.press(getByTestId('commands-button'));
    });

    await waitFor(() => {
      expect(handleOnPress).toHaveBeenCalled();
    });
  });

  it('should call textComposer handleChange when the button is clicked by default', async () => {
    const props = {};

    renderComponent({ channel, client, props });

    const { getByTestId, queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
    });

    await act(() => {
      userEvent.press(getByTestId('commands-button'));
    });

    await waitFor(() => {
      expect(channel.messageComposer.textComposer.text).toBe('/');
      expect(channel.messageComposer.textComposer.selection.start).toBe(1);
      expect(channel.messageComposer.textComposer.selection.end).toBe(1);
    });
  });
});
