import React from 'react';
import { Image, Pressable, Text } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
  AIConversationController,
  type AIConversationFeed,
  AISuggestions,
  ComposerView,
  type ComposerViewProps,
  sheetStore,
  sheetStoreApi,
  StreamTheme,
} from '../index';
import {
  AbstractMediaPickerService,
  type MediaAsset,
} from '../services/media-picker-service/AbstractMediaPickerService';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

class FakeMediaPickerService extends AbstractMediaPickerService {
  pickMedia = jest.fn(() => {
    const assets: MediaAsset[] = [{ name: 'a.png', uri: 'file:///a.png' }];
    this.appendAssets(assets);
    return Promise.resolve({ assets, cancelled: false });
  });

  takeMedia = jest.fn(() => Promise.resolve({ cancelled: true }));
}

const renderComposer = (props: Partial<ComposerViewProps> = {}) => {
  const onSendMessage = jest.fn(() => Promise.resolve());
  const utils = render(
    <StreamTheme>
      <ComposerView onSendMessage={onSendMessage} {...props} />
    </StreamTheme>,
  );
  return { ...utils, onSendMessage };
};

describe('ai-components ComposerView', () => {
  afterEach(() => {
    act(() => {
      sheetStoreApi.closeSheet();
    });
  });

  it('sends the typed text and clears the input', async () => {
    const { onSendMessage } = renderComposer();

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Hello there');
    await act(async () => {
      fireEvent.press(screen.getByTestId('send-up'));
      await flushPromises();
    });

    expect(onSendMessage).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello there' }));
    expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('');
  });

  it('shows the stop button while generating', () => {
    const stopGenerating = jest.fn(() => Promise.resolve());
    renderComposer({ isGenerating: true, stopGenerating });

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Hello');
    expect(screen.queryByTestId('send-up')).toBeNull();
  });

  it('opens the attachment sheet, picks media and sends it along', async () => {
    const mediaPickerService = new FakeMediaPickerService();
    const action = jest.fn();
    const { onSendMessage } = renderComposer({
      bottomSheetOptions: [{ action, subtitle: 'Do it', title: 'Custom option' }],
      mediaPickerService,
    });

    await act(async () => {
      fireEvent.press(screen.getByText('+'));
      await flushPromises();
    });
    // Once the keyboard has closed, which a sheet opening over it leaves to stray events.
    expect(KeyboardController.dismiss).toHaveBeenCalled();
    expect(sheetStore.getLatestValue().open).toBe(true);
    expect(screen.getByText('Camera')).toBeTruthy();
    expect(screen.getByText('Custom option')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Photos'));
      await flushPromises();
    });
    expect(mediaPickerService.pickMedia).toHaveBeenCalled();
    expect(sheetStore.getLatestValue().open).toBe(false);
    await waitFor(() => expect(screen.UNSAFE_getAllByType(Image)).toHaveLength(1));

    act(() => {
      sheetStoreApi.openSheet();
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Custom option'));
      await flushPromises();
    });
    expect(action).toHaveBeenCalled();

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'With an image');
    await act(async () => {
      fireEvent.press(screen.getByTestId('send-up'));
      await flushPromises();
    });
    expect(onSendMessage).toHaveBeenCalledWith({
      attachments: [{ name: 'a.png', uri: 'file:///a.png' }],
      custom: undefined,
      text: 'With an image',
    });
    expect(mediaPickerService.state.getLatestValue().assets).toEqual([]);
    expect(
      screen.UNSAFE_queryAllByType(Text).some((t) => t.props.children === 'With an image'),
    ).toBe(false);
  });

  it('sends the picked chat option, which stays picked until removed', async () => {
    const think = {
      description: 'More time to reason before answering',
      id: 'think_harder',
      shortTitle: 'Think',
      title: 'Think harder',
    };
    const { onSendMessage } = renderComposer({ chatOptions: [think] });

    await act(async () => {
      fireEvent.press(screen.getByText('+'));
      await flushPromises();
    });
    expect(screen.getByText('More time to reason before answering')).toBeTruthy();
    expect(screen.getByRole('radio', { checked: false })).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Think harder'));
      await flushPromises();
    });
    expect(sheetStore.getLatestValue().open).toBe(false);
    expect(screen.getByTestId('ai-selected-chat-option')).toBeTruthy();
    expect(screen.getByText('Think')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Why is the sky blue?');
    await act(async () => {
      fireEvent.press(screen.getByTestId('send-up'));
      await flushPromises();
    });
    expect(onSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ chatOption: think, text: 'Why is the sky blue?' }),
    );
    expect(screen.getByText('Think')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Remove option: Think'));
    expect(screen.queryByTestId('ai-selected-chat-option')).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'And now?');
    await act(async () => {
      fireEvent.press(screen.getByTestId('send-up'));
      await flushPromises();
    });
    expect(onSendMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ chatOption: undefined, text: 'And now?' }),
    );
  });

  it('removes the picked chat option when it is picked again', async () => {
    renderComposer({ chatOptions: [{ id: 'search', title: 'Web search' }] });

    act(() => {
      sheetStoreApi.openSheet();
    });
    await act(async () => {
      fireEvent.press(screen.getByText('Web search'));
      await flushPromises();
    });
    // Without a short title, the chip shows the title.
    expect(screen.getByLabelText('Remove option: Web search')).toBeTruthy();

    act(() => {
      sheetStoreApi.openSheet();
    });
    expect(screen.getByRole('radio', { checked: true })).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByRole('radio'));
      await flushPromises();
    });
    expect(screen.queryByTestId('ai-selected-chat-option')).toBeNull();
  });

  it('shows a picked file that is not an image as a file, with a way to remove it', () => {
    const mediaPickerService = new FakeMediaPickerService();
    mediaPickerService.appendAssets([
      { name: 'clip.mp4', size: 2048, type: 'video/mp4', uri: 'file:///clip.mp4' },
    ]);
    renderComposer({ mediaPickerService });

    expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
    expect(screen.getByText('clip.mp4')).toBeTruthy();
    expect(screen.getByText('MP4 · 2.00 kB')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Remove attachment'));
    expect(mediaPickerService.state.getLatestValue().assets).toEqual([]);
  });
});

describe('ComposerView header', () => {
  it('shows what it is given above the composer', () => {
    render(
      <StreamTheme>
        <ComposerView
          header={<Text>Starters</Text>}
          onSendMessage={jest.fn(() => Promise.resolve())}
        />
      </StreamTheme>,
    );
    expect(screen.getByText('Starters')).toBeTruthy();
  });
});

describe('ComposerView trailing', () => {
  it('shows what it is given after the message box, and its presses reach it', () => {
    const onTalk = jest.fn();
    render(
      <StreamTheme>
        <ComposerView
          onSendMessage={jest.fn(() => Promise.resolve())}
          trailing={
            <Pressable accessibilityLabel='Talk' accessibilityRole='button' onPress={onTalk} />
          }
        />
      </StreamTheme>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Talk' }));
    expect(onTalk).toHaveBeenCalledTimes(1);
  });
});

describe('ComposerView SpeechToTextButton', () => {
  const Dictate = () => <Text>dictate</Text>;

  it('shows the one it is given while the message box is empty, and the send button after', () => {
    renderComposer({ SpeechToTextButton: Dictate });
    expect(screen.getByText('dictate')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Hello');
    expect(screen.queryByText('dictate')).toBeNull();
    expect(screen.getByTestId('send-up')).toBeTruthy();
  });

  it('shows none with null', () => {
    renderComposer({ SpeechToTextButton: null });
    expect(screen.queryByText('dictate')).toBeNull();
    expect(screen.queryByTestId('send-up')).toBeNull();
    expect(screen.getByPlaceholderText('Ask anything')).toBeTruthy();
  });
});

describe('AISuggestions', () => {
  it('hands the picked suggestion over, and shows nothing without any', () => {
    const onSelect = jest.fn();
    const { rerender } = render(
      <StreamTheme>
        <AISuggestions onSelect={onSelect} suggestions={['Plan a weekend in Lisbon', 'Cook']} />
      </StreamTheme>,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Plan a weekend in Lisbon' }));
    expect(onSelect).toHaveBeenCalledWith('Plan a weekend in Lisbon');

    rerender(
      <StreamTheme>
        <AISuggestions onSelect={onSelect} suggestions={[]} />
      </StreamTheme>,
    );
    expect(screen.queryByTestId('ai-suggestions')).toBeNull();
  });
});

describe('ComposerView with a conversation', () => {
  const conversationOf = (messages: { id: string; role: string; text: string }[] = []) => {
    const transport = {
      connect: (feed: AIConversationFeed) => feed.updateMessages(messages),
      send: jest.fn(() => Promise.resolve()),
      stop: jest.fn(() => Promise.resolve()),
    };
    return { controller: new AIConversationController({ transport }), transport };
  };

  const renderWith = (controller: AIConversationController) =>
    render(
      <StreamTheme>
        <ComposerView conversation={controller} />
      </StreamTheme>,
    );

  it('sends to the conversation, and stops the agent while it answers', async () => {
    const { controller, transport } = conversationOf([{ id: 'u1', role: 'user', text: 'Hi' }]);
    renderWith(controller);

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Plan a weekend in Lisbon');
    await act(async () => {
      fireEvent.press(screen.getByTestId('send-up'));
      await flushPromises();
    });

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'message', text: 'Plan a weekend in Lisbon' }),
    );
    expect(controller.state.getLatestValue().status).toBe('submitted');

    fireEvent.press(screen.getByTestId('stop-generating'));
    await act(flushPromises);

    expect(transport.stop).toHaveBeenCalledTimes(1);
    expect(controller.state.getLatestValue().status).toBe('ready');
    controller.dispose();
  });

  it('shows the draft of the conversation it is given', () => {
    const first = conversationOf().controller;
    const second = conversationOf().controller;
    first.composer.partialNext({ text: 'Lisbon' });
    second.composer.partialNext({ text: 'Porto' });
    const { rerender } = renderWith(first);
    expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('Lisbon');

    rerender(
      <StreamTheme>
        <ComposerView conversation={second} />
      </StreamTheme>,
    );

    expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('Porto');
    first.dispose();
    second.dispose();
  });

  it('says the person is editing a message, and cancels it', () => {
    const message = { id: 'u1', role: 'user', text: 'Plan Lisbon' };
    const { controller } = conversationOf([message, { id: 'a1', role: 'assistant', text: 'Done' }]);
    renderWith(controller);
    expect(screen.queryByTestId('ai-editing-message')).toBeNull();

    act(() => controller.edit(message));

    expect(screen.getByText('Editing message')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('Plan Lisbon');

    fireEvent.press(screen.getByRole('button', { name: 'Cancel editing' }));

    expect(screen.queryByTestId('ai-editing-message')).toBeNull();
    expect(controller.editingMessage).toBeUndefined();
    expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('');
    controller.dispose();
  });
});
