import React from 'react';
import { Keyboard, Text } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ComposerView, sheetStore, sheetStoreApi, StreamTheme } from '../index';
import { dismissKeyboard, KeyboardStickyView, keyboardHeight } from '../internal/keyboard';

jest.mock('react-native-keyboard-controller', () => {
  throw new Error("Cannot find module 'react-native-keyboard-controller'");
});

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('without react-native-keyboard-controller', () => {
  afterEach(() => {
    act(() => {
      sheetStoreApi.closeSheet();
    });
    jest.restoreAllMocks();
  });

  it('lays the sticky view out as a plain view', () => {
    render(
      <KeyboardStickyView offset={{ closed: 0, opened: 34 }} testID='sticky'>
        <Text>inside</Text>
      </KeyboardStickyView>,
    );

    const sticky = screen.getByTestId('sticky');
    expect(sticky.type).toBe('View');
    expect(sticky.props.offset).toBeUndefined();
    expect(screen.getByText('inside')).toBeTruthy();
    expect(keyboardHeight()).toBe(0);
  });

  it('closes the keyboard with React Native', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');

    await expect(dismissKeyboard()).resolves.toBeUndefined();
    expect(dismiss).toHaveBeenCalled();
  });

  it('renders the composer and opens its sheet', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    render(
      <StreamTheme>
        <ComposerView onSendMessage={() => Promise.resolve()} />
      </StreamTheme>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('+'));
      await flushPromises();
    });

    expect(dismiss).toHaveBeenCalled();
    expect(sheetStore.getLatestValue().open).toBe(true);
  });
});
