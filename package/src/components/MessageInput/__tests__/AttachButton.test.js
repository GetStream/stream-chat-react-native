import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import * as NativeHandler from '../../../native';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AttachButton } from '../AttachButton';

const renderComponent = ({ channelProps, client, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...channelProps}>
          <AttachButton {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('AttachButton', () => {
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

  it('should render an disabled AttachButton', async () => {
    const handleOnPress = jest.fn();
    const channelProps = { channel };
    const props = { disabled: true, handleOnPress };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    const snapshot = screen.toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should render a enabled AttachButton', async () => {
    const handleOnPress = jest.fn();
    const channelProps = { channel };
    const props = { disabled: false, handleOnPress };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(handleOnPress).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(handleOnPress).toHaveBeenCalledTimes(1);
    });

    const snapshot = screen.toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it('should call handleAttachButtonPress when the button is clicked if passed', async () => {
    const handleAttachButtonPress = jest.fn();
    const channelProps = { channel, handleAttachButtonPress };
    const props = { disabled: false };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
      expect(handleAttachButtonPress).toHaveBeenCalledTimes(0);
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(handleAttachButtonPress).toHaveBeenCalledTimes(1);
    });

    const snapshot = screen.toJSON();

    await waitFor(() => {
      expect(snapshot).toMatchSnapshot();
    });
  });

  it("should open native attachment picker when the media library isn't present", async () => {
    jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => false);

    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(queryByTestId('native-attachment-picker')).toBeTruthy();
    });
  });

  it('should open stream attachment picker when the media library is present', async () => {
    jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => true);

    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    await waitFor(() => {
      expect(queryByTestId('attach-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(queryByTestId('attachment-picker-list')).toBeTruthy();
    });
  });
});
