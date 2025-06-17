import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { generateImageAttachment } from '../../../mock-builders/attachments';
import { FileState } from '../../../utils/utils';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { InputButtons } from '../InputButtons';

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

  // TODO: Add it back once the command inject PR is merged
  it.skip('should return null if the commands are set on the textComposer', async () => {
    const props = {};
    const channelProps = { channel };

    channel.messageComposer.textComposer.setCommand({ description: 'Ban a user', name: 'ban' });

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('more-options-button')).toBeFalsy();
      expect(queryByTestId('commands-button')).toBeFalsy();
      expect(queryByTestId('attach-button')).toBeFalsy();
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
      expect(queryByTestId('more-options-button')).toBeFalsy();
      expect(queryByTestId('commands-button')).toBeFalsy();
      expect(queryByTestId('attach-button')).toBeFalsy();
    });
  });

  it('should show more options when the hasCommand is true and the hasAttachmentUploadCapabilities is true', async () => {
    const props = {};
    const channelProps = {
      channel,
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
      expect(queryByTestId('attach-button')).toBeTruthy();
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

  it('should show only commands button when the hasCommand is true and the hasAttachmentUploadCapabilities is false', async () => {
    const props = {};
    const channelProps = {
      channel,
      overrideOwnCapabilities: {
        uploadFile: false,
      },
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
      expect(queryByTestId('attach-button')).toBeFalsy();
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

  it('should show more options button when there is text in the textComposer', async () => {
    const props = {};
    const channelProps = {
      channel,
    };
    channel.messageComposer.textComposer.setText('hello');

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('more-options-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(queryByTestId('more-options-button'));
    });

    await waitFor(() => {
      // Falsy, because the textComposer has text. This is a good test.
      expect(queryByTestId('commands-button')).toBeFalsy();
      expect(queryByTestId('attach-button')).toBeTruthy();
    });
  });

  it('should show more options button when there is attachments', async () => {
    const props = {};
    const channelProps = {
      channel,
    };
    channel.messageComposer.attachmentManager.upsertAttachments([
      generateImageAttachment({
        localMetadata: {
          id: 'image-attachment',
          uploadState: FileState.UPLOADING,
        },
      }),
    ]);

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('more-options-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(queryByTestId('more-options-button'));
    });

    await waitFor(() => {
      expect(queryByTestId('commands-button')).toBeTruthy();
      expect(queryByTestId('attach-button')).toBeTruthy();
    });
  });
});
