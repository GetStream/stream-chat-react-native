import React from 'react';

import { act, cleanup, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { InputButtons } from '../components/InputButtons/index';

const renderComponent = ({ channelProps, client, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...channelProps}>
          <InputButtons {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('InputButtons', () => {
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

  it('should return null if hasCommands is false and hasAttachmentUploadCapabilities is false', async () => {
    const props = {};
    const channelProps = {
      channel,
      hasCommands: false,
      overrideOwnCapabilities: {
        uploadFile: false,
      },
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeFalsy();
      expect(queryByTestId('attach-button')).toBeFalsy();
    });
  });

  it('should show only attach button when the hasCommand is false and the hasAttachmentUploadCapabilities is true', async () => {
    const props = {};
    const channelProps = {
      channel,
      hasCommands: false,
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeFalsy();
      expect(queryByTestId('attach-button')).toBeTruthy();
    });
  });

  it('should not show commands buttons when there is text in the textComposer', async () => {
    const props = {};
    const channelProps = {
      channel,
    };
    channel.messageComposer.textComposer.setText('hello');
    renderComponent({ channelProps, client, props });
    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeFalsy();
    });
  });
});
