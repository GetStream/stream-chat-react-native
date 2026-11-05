import React from 'react';

import { renderHook } from '@testing-library/react-native';

import { defaultTheme, mergeThemes, StreamTheme, useTheme } from '../index';

describe('ai-components theme', () => {
  it('throws when used outside of StreamTheme', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      'The useTheme hook was called outside the StreamTheme Provider.',
    );
    jest.restoreAllMocks();
  });

  it('deep merges style overrides without mutating the default theme', () => {
    const merged = mergeThemes({
      style: { colors: { accent_blue: 'red' }, composer: { inputPillHeight: 60 } },
    });

    expect(merged.colors.accent_blue).toBe('red');
    expect(merged.colors.black).toBe(defaultTheme.colors.black);
    expect(merged.composer.inputPillHeight).toBe(60);
    expect(defaultTheme.colors.accent_blue).toBe('#005FFF');
  });

  it('provides the merged theme, or a pre-merged one', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <StreamTheme style={{ colors: { grey: 'blue' } }}>{children}</StreamTheme>
      ),
    });
    expect(result.current.theme.colors.grey).toBe('blue');

    const mergedStyle = mergeThemes({ style: { colors: { grey: 'green' } } });
    const { result: preMerged } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <StreamTheme mergedStyle={mergedStyle}>{children}</StreamTheme>,
    });
    expect(preMerged.current.theme).toBe(mergedStyle);
  });
  it('draws the conversation’s parts in the app’s palette when it changes it, as for dark mode', () => {
    const dark = mergeThemes({
      style: {
        colors: { black: '#FFFFFF', grey_whisper: '#27272F', white: '#050509' },
        suggestions: { text: '#FF0000' },
      },
    });
    expect(dark.message?.userMessageBackground).toBe('#27272F');
    expect(dark.message?.userMessageText).toBe('#FFFFFF');
    expect(dark.conversation?.scrollButtonBackground).toBe('#050509');
    // A part the style sets keeps its own; one drawn in a color it left alone keeps the design's.
    expect(dark.suggestions?.text).toBe('#FF0000');
    expect(dark.chatOptions?.chipText).toBe(defaultTheme.chatOptions?.chipText);
    // Without palette changes, the design's own colors stay.
    expect(mergeThemes({ style: { conversation: {} } }).message?.userMessageBackground).toBe(
      defaultTheme.message?.userMessageBackground,
    );
  });
});
