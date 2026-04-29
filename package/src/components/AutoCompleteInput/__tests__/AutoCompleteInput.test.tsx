import React from 'react';

import type { TextInput } from 'react-native';

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

import { OverlayProvider } from '../../../contexts';
import type { InputBoxRef } from '../../../contexts/messageInputContext/MessageInputContext';
import { initiateClientWithChannels } from '../../../mock-builders/api/initiateClientWithChannels';
import type { ChannelProps } from '../../Channel/Channel';
import { Channel } from '../../Channel/Channel';
import { Chat } from '../../Chat/Chat';
import { AutoCompleteInput } from '../AutoCompleteInput';

const renderComponent = ({
  channelProps,
  client,
  props,
}: {
  channelProps: Partial<ChannelProps>;
  client: StreamChat;
  props: React.ComponentProps<typeof AutoCompleteInput>;
}) => {
  return render(
    <OverlayProvider>
      <Chat client={client}>
        <Channel {...(channelProps as ChannelProps)}>
          <AutoCompleteInput {...props} />
        </Channel>
      </Chat>
    </OverlayProvider>,
  );
};

describe('AutoCompleteInput', () => {
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

  it('should render AutoCompleteInput', async () => {
    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input')!;

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

    const input = queryByTestId('auto-complete-text-input')!;

    await waitFor(() => {
      expect(input.props.editable).toBeFalsy();
    });
  });

  it('should have the maxLength same as the one on the config of channel', async () => {
    jest.spyOn(channel, 'getConfig').mockReturnValue({
      max_message_length: 10,
    } as unknown as ReturnType<typeof channel.getConfig>);
    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input')!;

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

    const input = queryByTestId('auto-complete-text-input')!;

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

  it('should expose imperative state handlers on the input ref', async () => {
    let inputRef: InputBoxRef | null = null;
    const text = 'hello';
    const channelProps = {
      channel,
      setInputRef: (ref: TextInput | null) => {
        inputRef = ref as InputBoxRef | null;
      },
    };
    const props = {};

    renderComponent({ channelProps, client, props });

    await waitFor(() => {
      expect(inputRef?.clearState).toBeTruthy();
      expect(inputRef?.restoreState).toBeTruthy();
    });

    act(() => {
      fireEvent.changeText(screen.getByTestId('auto-complete-text-input'), text);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auto-complete-text-input').props.value).toBe(text);
    });

    act(() => {
      inputRef?.clearState();
    });

    await waitFor(() => {
      expect(screen.getByTestId('auto-complete-text-input').props.value).toBe('');
      expect(channel.messageComposer.textComposer.text).toBe(text);
    });

    act(() => {
      inputRef?.restoreState(text);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auto-complete-text-input').props.value).toBe(text);
    });
  });

  it('should call the textComposer setSelection when the onSelectionChange is triggered', async () => {
    const { textComposer } = channel.messageComposer;

    const spySetSelection = jest.spyOn(textComposer, 'setSelection');

    const channelProps = { channel };
    const props = {};

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input')!;

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
    { cooldownRemainingSeconds: undefined, result: 'Send a message' },
    { cooldownRemainingSeconds: 10, result: 'Slow mode, wait 10s...' },
  ])('should have the placeholderText as Slow mode ON when cooldown is active', async (data) => {
    const channelProps = { channel };
    const props = {
      cooldownRemainingSeconds: data.cooldownRemainingSeconds,
    };

    renderComponent({ channelProps, client, props });

    const { queryByTestId } = screen;

    const input = queryByTestId('auto-complete-text-input')!;

    await waitFor(() => {
      expect(input.props.placeholder).toBe(data.result);
    });
  });
});
