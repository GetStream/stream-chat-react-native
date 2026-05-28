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

    // RN fires both events for every keystroke; we forward to the LLC once
    // both have settled, so the test mirrors that.
    act(() => {
      fireEvent.changeText(input, 'hello');
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: 5, start: 5 } },
      });
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

  it('forwards the real caret position to handleChange when typing in the middle of multi-line text', async () => {
    // Regression: when the user inserts a character somewhere other than the
    // end of the text (e.g. typing "@" between paragraphs), the original
    // implementation passed selection.end = newText.length, which caused the
    // LLC mention-trigger regex to miss "@" on multi-line input because it
    // only tolerates one whitespace between "@" and end-of-string.
    const { textComposer } = channel.messageComposer;
    const spyHandleChange = jest.spyOn(textComposer, 'handleChange');

    renderComponent({ channelProps: { channel }, client, props: {} });

    const input = screen.getByTestId('auto-complete-text-input');

    // Seed the input with some multi-line text and place the caret between
    // the two leading newlines (position 6 — right after "asdf\n\n", before
    // the trailing "\n\n dsfa").
    const seeded = 'asdf\n\n\n\n dsfa';
    const caret = 6;
    act(() => {
      fireEvent.changeText(input, seeded);
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: caret, start: caret } },
      });
    });

    await waitFor(() => {
      expect(spyHandleChange).toHaveBeenCalledWith({
        selection: { end: caret, start: caret },
        text: seeded,
      });
    });

    spyHandleChange.mockClear();

    // User types "@" at the caret. Both events fire in a single keystroke.
    const inserted = 'asdf\n\n@\n\n dsfa';
    const newCaret = caret + 1;
    act(() => {
      fireEvent.changeText(input, inserted);
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: newCaret, start: newCaret } },
      });
    });

    await waitFor(() => {
      // Must land right after the inserted "@", not at end-of-string —
      // otherwise the LLC mention regex misses "@" because of the trailing
      // "\n\n dsfa".
      expect(spyHandleChange).toHaveBeenCalledWith({
        selection: { end: newCaret, start: newCaret },
        text: inserted,
      });
    });
  });

  it('forwards the real caret to handleChange when the user deletes "@" and retypes it', async () => {
    // Regression: deleting "@" and retyping it on the same single line caused
    // the picker to stay hidden on iOS — and on Android even with newlines.
    // The bug was that we derived the caret from a text-length delta plus a
    // stale ref; the coalesced flush now uses whatever native actually
    // reported via onSelectionChange.
    const { textComposer } = channel.messageComposer;
    const spyHandleChange = jest.spyOn(textComposer, 'handleChange');

    renderComponent({ channelProps: { channel }, client, props: {} });

    const input = screen.getByTestId('auto-complete-text-input');

    // 1. Seed "asdf @ dsfa" with the caret right after "@".
    act(() => {
      fireEvent.changeText(input, 'asdf @ dsfa');
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: 6, start: 6 } },
      });
    });

    await waitFor(() => {
      expect(spyHandleChange).toHaveBeenCalledWith({
        selection: { end: 6, start: 6 },
        text: 'asdf @ dsfa',
      });
    });

    // 2. Delete the "@" — text shrinks by one, caret moves to position 5.
    act(() => {
      fireEvent.changeText(input, 'asdf  dsfa');
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: 5, start: 5 } },
      });
    });

    spyHandleChange.mockClear();

    // 3. Retype "@" at position 5.
    act(() => {
      fireEvent.changeText(input, 'asdf @ dsfa');
      fireEvent(input, 'selectionChange', {
        nativeEvent: { selection: { end: 6, start: 6 } },
      });
    });

    await waitFor(() => {
      // The cursor must be reported at 6 (right after the new "@"), not
      // somewhere stale. With a wrong caret, the LLC slice would include
      // " dsfa" after the "@" and the query would be " dsfa" instead of "",
      // which returns zero users → picker stays hidden.
      expect(spyHandleChange).toHaveBeenCalledWith({
        selection: { end: 6, start: 6 },
        text: 'asdf @ dsfa',
      });
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
