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
    it('keeps up with what arrives when no pace is given', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) => useStreamingMessage({ text }),
        { initialProps: { text: '' } },
      );
      const chunk = 'x'.repeat(250);
      rerender({ text: chunk });
      act(() => {
        jest.advanceTimersByTime(16);
      });
      // 250 letters in 0.4 seconds: 10 a frame.
      expect(result.current.streamedMessageText).toHaveLength(10);
      expect(result.current.isWriting).toBe(true);

      act(() => {
        jest.advanceTimersByTime(420);
      });
      expect(result.current.streamedMessageText).toBe(chunk);
      expect(result.current.isWriting).toBe(false);
    });

    it('types at least a letter a frame when little arrives', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) => useStreamingMessage({ text }),
        { initialProps: { text: 'Hi' } },
      );
      rerender({ text: 'Hi there' });
      act(() => {
        jest.advanceTimersByTime(16);
      });
      expect(result.current.streamedMessageText).toBe('Hi ');
    });

    it('shows the whole text at once when the animation is skipped', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) =>
          useStreamingMessage({ letterInterval: 50, renderingLetterCount: 1, text }),
        { initialProps: { text: '' } },
      );
      rerender({ text: 'A long answer' });
      act(() => result.current.skipAnimation());
      expect(result.current.streamedMessageText).toBe('A long answer');
      expect(result.current.isWriting).toBe(false);
    });

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

    it('shows another text at once rather than typing it out', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) =>
          useStreamingMessage({ letterInterval: 10, renderingLetterCount: 2, text }),
        { initialProps: { text: 'Hi' } },
      );

      // As when a list reuses the view for another, longer message.
      rerender({ text: 'Goodbye, and thanks for all the fish' });
      expect(result.current.streamedMessageText).toBe('Goodbye, and thanks for all the fish');
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.streamedMessageText).toBe('Goodbye, and thanks for all the fish');

      // And one shorter than what was shown.
      rerender({ text: 'Bye' });
      expect(result.current.streamedMessageText).toBe('Bye');

      // Text added to the end of it is still typed out.
      rerender({ text: 'Bye now' });
      act(() => {
        jest.advanceTimersByTime(10);
      });
      expect(result.current.streamedMessageText).toBe('Bye n');
    });

    it('says whether text is still being typed out', () => {
      const { result, rerender } = renderHook(
        ({ text }: { text: string }) =>
          useStreamingMessage({ letterInterval: 10, renderingLetterCount: 2, text }),
        { initialProps: { text: 'Hello' } },
      );
      expect(result.current.isWriting).toBe(false);

      rerender({ text: 'Hello world' });
      expect(result.current.isWriting).toBe(true);
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.isWriting).toBe(false);

      // Another text shows at once, so nothing is being typed.
      rerender({ text: 'Bye' });
      expect(result.current.isWriting).toBe(false);
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
    it('reports when it starts and stops typing', () => {
      const onWritingChange = jest.fn();
      const { rerender } = render(
        <StreamTheme>
          <StreamingMessageView letterInterval={10} onWritingChange={onWritingChange} text='Hi' />
        </StreamTheme>,
      );
      rerender(
        <StreamTheme>
          <StreamingMessageView
            letterInterval={10}
            onWritingChange={onWritingChange}
            text='Hi there, friend'
          />
        </StreamTheme>,
      );
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(onWritingChange.mock.calls.map(([writing]) => writing)).toEqual([false, true, false]);
    });

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
