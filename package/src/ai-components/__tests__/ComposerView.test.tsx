import React from 'react';
import { Image, Text } from 'react-native';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import {
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

    fireEvent.press(screen.getByText('+'));
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
});
