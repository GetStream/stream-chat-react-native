import React from 'react';

import { Text } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../contexts';
import { useAttachmentPickerState } from '../../../hooks/useAttachmentPickerState';

import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import * as NativeHandler from '../../../native';
import type { ChannelProps } from '../../Channel/Channel';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AttachButton } from '../components/InputButtons/AttachButton';

const SelectedPicker = () => {
  const { selectedPicker } = useAttachmentPickerState();
  return <Text testID='selected-picker'>{selectedPicker ?? 'none'}</Text>;
};

const renderComponent = ({
  channelProps,
  client,
  props,
}: {
  channelProps: Partial<ChannelProps>;
  client: StreamChat;
  props: React.ComponentProps<typeof AttachButton>;
}) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...(channelProps as ChannelProps)}>
          <AttachButton {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

const renderWithSelectedPicker = ({
  channelProps,
  client,
}: {
  channelProps: Partial<ChannelProps>;
  client: StreamChat;
}) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...(channelProps as ChannelProps)}>
          <AttachButton />
          <SelectedPicker />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('AttachButton', () => {
  let client: StreamChat;
  let channel: ChannelType;

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

  // TODO: Re-enable later
  // it("should open native attachment picker when the media library isn't present", async () => {
  //   jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => false);
  //
  //   const channelProps = { channel };
  //   const props = {};
  //
  //   renderComponent({ channelProps, client, props });
  //
  //   const { queryByTestId } = screen;
  //
  //   await waitFor(() => {
  //     expect(queryByTestId('attach-button')).toBeTruthy();
  //   });
  //
  //   act(() => {
  //     fireEvent.press(screen.getByTestId('attach-button'));
  //   });
  //
  //   await waitFor(() => {
  //     expect(queryByTestId('native-attachment-picker')).toBeTruthy();
  //   });
  // });

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

  it('should close the attachment picker on second press when focusInputOnPickerClose is false', async () => {
    jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => true);

    const channelProps = { channel, focusInputOnPickerClose: false };
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

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(queryByTestId('attachment-picker-list')).toBeNull();
    });
  });

  it('should select the image picker when pressed', async () => {
    jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => true);

    renderWithSelectedPicker({ channelProps: { channel }, client });

    await waitFor(() => {
      expect(screen.queryByTestId('attach-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-picker')).toHaveTextContent('images');
    });
  });

  it('should not select a picker when pressed if shouldRenderAttachmentPicker is false', async () => {
    jest.spyOn(NativeHandler, 'isImageMediaLibraryAvailable').mockImplementation(() => true);

    renderWithSelectedPicker({
      channelProps: { channel, shouldRenderAttachmentPicker: false },
      client,
    });

    await waitFor(() => {
      expect(screen.queryByTestId('attach-button')).toBeTruthy();
    });

    act(() => {
      fireEvent.press(screen.getByTestId('attach-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('selected-picker')).toHaveTextContent('none');
      expect(screen.queryByTestId('attachment-picker-list')).toBeNull();
    });
  });

  it('should render the attachment picker by default', async () => {
    renderWithSelectedPicker({ channelProps: { channel }, client });

    await waitFor(() => {
      expect(screen.queryByTestId('upload-file-touchable')).toBeTruthy();
    });
  });

  it('should not render the attachment picker when shouldRenderAttachmentPicker is false', async () => {
    renderWithSelectedPicker({
      channelProps: { channel, shouldRenderAttachmentPicker: false },
      client,
    });

    await waitFor(() => {
      expect(screen.queryByTestId('attach-button')).toBeTruthy();
    });

    expect(screen.queryByTestId('upload-file-touchable')).toBeNull();
  });
});
