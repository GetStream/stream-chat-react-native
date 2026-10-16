import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { registerNativeHandlers } from '../../native';
import {
  AITypingIndicatorView,
  StreamingMessageView,
  StreamTheme,
  useStreamingMessage,
} from '../index';

describe('ai-components streaming', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useStreamingMessage', () => {
    it('renders the initial text immediately and animates text appended later', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) =>
          useStreamingMessage({ letterInterval: 10, renderingLetterCount: 2, text }),
        { initialProps: { text: 'Hello' } },
      );
      expect(result.current.streamedMessageText).toBe('Hello');

      rerender({ text: 'Hello world' });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      expect(result.current.streamedMessageText).toBe('Hello w');

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.streamedMessageText).toBe('Hello world');
    });

    it('optimistically closes a code fence while it is being streamed', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) =>
          useStreamingMessage({ letterInterval: 10, renderingLetterCount: 4, text }),
        { initialProps: { text: '' } },
      );

      rerender({ text: '```js\ncode' });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      expect(result.current.streamedMessageText).toBe('```j```');
    });
  });

  describe('StreamingMessageView', () => {
    it('renders markdown and handles links with the provided callback', () => {
      const onLink = jest.fn();
      render(
        <StreamTheme>
          <StreamingMessageView onLink={onLink} text={'**Hi** see getstream.io'} />
        </StreamTheme>,
      );

      expect(screen.getByText('Hi')).toBeTruthy();
      fireEvent.press(screen.getByText('getstream.io'));
      expect(onLink).toHaveBeenCalledWith('http://getstream.io');
    });

    it('opens links with Linking by default', async () => {
      const canOpenURL = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
      render(
        <StreamTheme>
          <StreamingMessageView text={'see getstream.io'} />
        </StreamTheme>,
      );

      await act(async () => {
        fireEvent.press(screen.getByText('getstream.io'));
        // Let the `canOpenURL` promise resolve.
        await Promise.resolve();
      });

      expect(canOpenURL).toHaveBeenCalledWith('http://getstream.io');
      expect(openURL).toHaveBeenCalledWith('http://getstream.io');
    });
  });

  describe('AITypingIndicatorView', () => {
    it('lays the SDK native shimmer over the text', () => {
      const MockShimmer = jest.fn((props) => <View testID='native-shimmer' {...props} />);
      registerNativeHandlers({ NativeShimmerView: MockShimmer });

      render(
        <StreamTheme>
          <AITypingIndicatorView text={'Thinking...'} />
        </StreamTheme>,
      );

      expect(screen.getByText('Thinking...')).toBeTruthy();
      const shimmer = screen.getByTestId('native-shimmer');
      // The native shimmer paints behind its children, so it must be a sibling drawn after the
      // text, covering it, rather than its parent.
      expect(shimmer.props.children).toBeUndefined();
      expect(MockShimmer.mock.calls[0]?.[0]).toMatchObject({
        baseColor: 'transparent',
        duration: 1200,
        gradientColor: '#FFFFFF',
        pointerEvents: 'none',
      });
      expect(StyleSheet.flatten(shimmer.props.style)).toMatchObject({
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
      });

      registerNativeHandlers({ NativeShimmerView: null as unknown as undefined });
    });
  });
});
