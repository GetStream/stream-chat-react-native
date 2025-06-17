import React from 'react';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { OverlayProvider } from '../../../contexts';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AutoCompleteInput } from '../AutoCompleteInput';

const renderComponent = ({ channelProps, client, props }) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...channelProps}>
          <AutoCompleteInput {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('AutoCompleteInput', () => {
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

  it('should render AutoCompleteInput', async () => {
    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    await waitFor(() => {
      expect(input).toBeTruthy();
    });
  });

  it('should have the editable prop as false when the message composer config is set', async () => {
    const channelProps = { channel };
    const props = {};

    channel.messageComposer.updateConfig({ text: { enabled: false } });

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    await waitFor(() => {
      expect(input.props.editable).toBeFalsy();
    });
  });

  it('should have the maxLength same as the one on the config of channel', async () => {
    jest.spyOn(channel, 'getConfig').mockReturnValue({
      max_message_length: 10,
    });
    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    await waitFor(() => {
      expect(input.props.maxLength).toBe(10);
    });
  });

  it('should call the textComposer handleChange when the onChangeText is triggered', async () => {
    const { textComposer } = channel.messageComposer;

    const spyHandleChange = jest.spyOn(textComposer, 'handleChange');

    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    act(() => {
      fireEvent.changeText(input, 'hello');
    });

    await waitFor(() => {
      expect(spyHandleChange).toHaveBeenCalled();
      expect(spyHandleChange).toHaveBeenCalledWith({
        selection: { end: 5, start: 5 },
        text: 'hello',
      });
      expect(input.props.value).toBe('hello');
    });
  });

  it('should style the text input with maxHeight that is set by the layout', async () => {
    const channelProps = { channel };
    const props = { numberOfLines: 10 };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    act(() => {
      fireEvent(input, 'contentSizeChange', {
        nativeEvent: {
          contentSize: { height: 100 },
        },
      });
    });

    await waitFor(() => {
      expect(input.props.style[1].maxHeight).toBe(1000);
    });
  });

  it('should call the textComposer setSelection when the onSelectionChange is triggered', async () => {
    const { textComposer } = channel.messageComposer;

    const spySetSelection = jest.spyOn(textComposer, 'setSelection');

    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    act(() => {
      fireEvent(input, 'selectionChange', {
        nativeEvent: {
          selection: { end: 5, start: 5 },
        },
      });
    });

    await waitFor(() => {
      expect(spySetSelection).toHaveBeenCalled();
      expect(spySetSelection).toHaveBeenCalledWith({ end: 5, start: 5 });
    });
  });

  // TODO: Add a test for command
  it.each([
    { cooldownActive: false, result: 'Send a message' },
    { cooldownActive: true, result: 'Slow mode ON' },
  ])('should have the placeholderText as Slow mode ON when cooldown is active', async (data) => {
    const channelProps = { channel };
    const props = {
      cooldownActive: data.cooldownActive,
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input');

    await waitFor(() => {
      expect(input.props.placeholder).toBe(data.result);
    });
  });
});
