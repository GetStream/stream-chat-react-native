import React from 'react';
import { DeviceEventEmitter } from 'react-native';

import { act, fireEvent, render, screen } from '@testing-library/react-native';

import * as aiComponents from '../index';
import { AIDictation } from '../native/AIDictation';

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const createNativeModule = () => ({
  addListener: jest.fn(),
  cancel: jest.fn(),
  isRecording: jest.fn(() => false),
  removeListeners: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
});

// The AI components read the native module through this getter, so every test can decide whether
// the module is "compiled in".
let mockNativeModule: ReturnType<typeof createNativeModule> | null = null;
jest.mock('../native-specs/NativeAIDictation', () => ({
  __esModule: true,
  get default() {
    return mockNativeModule;
  },
}));

const renderComposer = () =>
  render(
    <aiComponents.StreamTheme>
      <aiComponents.ComposerView onSendMessage={jest.fn(() => Promise.resolve())} />
    </aiComponents.StreamTheme>,
  );

describe('ai-components dictation', () => {
  afterEach(() => {
    mockNativeModule = null;
  });

  describe('when the native module is not compiled in', () => {
    it('reports dictation as unavailable, hides the mic button and warns once in development', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

      expect(aiComponents.isDictationAvailable()).toBe(false);
      renderComposer();
      renderComposer();

      expect(screen.UNSAFE_queryAllByProps({ fill: '#7A7A7A' })).toHaveLength(0);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('$StreamChatEnableDictation'));
      warn.mockRestore();
    });

    it('turns the low-level API into no-ops', () => {
      expect(() => AIDictation.start()).not.toThrow();
      expect(AIDictation.isRecording()).toBe(false);
      const unsubscribe = AIDictation.addResultListener(jest.fn());
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('when the native module is compiled in', () => {
    it('starts dictation and streams the transcript into the input', async () => {
      const nativeModule = createNativeModule();
      mockNativeModule = nativeModule;
      expect(aiComponents.isDictationAvailable()).toBe(true);

      renderComposer();

      // The mic is the only icon rendered by an empty composer.
      const mic = screen.UNSAFE_getByProps({ fill: '#7A7A7A' });
      await act(async () => {
        fireEvent.press(mic);
        await flushPromises();
      });
      expect(nativeModule.start).toHaveBeenCalledWith({
        interimResults: true,
        language: 'en-US',
        silenceTimeoutMs: 2500,
      });

      act(() => {
        DeviceEventEmitter.emit('AIDictationOnState', { state: 'listening' });
      });
      // While recording the mic is highlighted.
      expect(screen.UNSAFE_getByProps({ fill: '#005FFF' })).toBeTruthy();

      act(() => {
        DeviceEventEmitter.emit('AIDictationOnResult', { isFinal: false, text: 'hello wor' });
      });
      expect(screen.getByPlaceholderText('Ask anything').props.value).toBe('hello wor');

      // Pressing the mic while listening stops dictation.
      fireEvent.press(screen.UNSAFE_getByProps({ fill: '#005FFF' }));
      expect(nativeModule.stop).toHaveBeenCalled();

      act(() => {
        DeviceEventEmitter.emit('AIDictationOnState', { state: 'stopping' });
        DeviceEventEmitter.emit('AIDictationOnResult', { isFinal: true, text: 'hello world' });
      });
      expect(aiComponents.dictationStore.getLatestValue()).toMatchObject({
        isRecording: false,
        state: 'idle',
        transcript: 'hello world',
      });
      // Once dictation finishes with text in the input, the send button replaces the mic.
      expect(screen.getByTestId('send-up')).toBeTruthy();
      expect(nativeModule.cancel).toHaveBeenCalled();
    });

    it('stores native errors', async () => {
      mockNativeModule = createNativeModule();
      renderComposer();

      await act(async () => {
        fireEvent.press(screen.UNSAFE_getByProps({ fill: '#7A7A7A' }));
        await flushPromises();
      });
      act(() => {
        DeviceEventEmitter.emit('AIDictationOnState', { state: 'listening' });
        DeviceEventEmitter.emit('AIDictationOnError', { code: 'X', message: 'boom' });
      });

      expect(aiComponents.dictationStore.getLatestValue()).toMatchObject({
        error: { code: 'X', message: 'boom' },
        isRecording: false,
        state: 'idle',
      });
    });
  });
});
