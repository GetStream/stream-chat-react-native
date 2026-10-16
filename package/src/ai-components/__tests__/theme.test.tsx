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
});
