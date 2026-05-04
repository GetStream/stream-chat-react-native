import React from 'react';

import { renderHook } from '@testing-library/react-native';

import {
  AccessibilityProvider,
  accessibilityContextDefaultValue,
  useAccessibilityContext,
} from '../AccessibilityContext';

const wrap =
  (props: Parameters<typeof AccessibilityProvider>[0]) =>
  ({ children }: { children: React.ReactNode }) => (
    <AccessibilityProvider {...props}>{children}</AccessibilityProvider>
  );

describe('AccessibilityContext', () => {
  it('defaults to disabled', () => {
    const { result } = renderHook(() => useAccessibilityContext(), {
      wrapper: wrap({ children: null }),
    });
    expect(result.current.enabled).toBe(false);
    expect(result.current).toEqual(accessibilityContextDefaultValue);
  });

  it('merges integrator config with defaults', () => {
    const { result } = renderHook(() => useAccessibilityContext(), {
      wrapper: wrap({ children: null, value: { enabled: true, audioRecorderTapMode: 'always' } }),
    });
    expect(result.current.enabled).toBe(true);
    expect(result.current.audioRecorderTapMode).toBe('always');
    expect(result.current.announceNewMessages).toBe(true);
    expect(result.current.announceTypingIndicator).toBe(false);
  });

  it('returns defaults when used outside the provider', () => {
    const { result } = renderHook(() => useAccessibilityContext());
    expect(result.current).toEqual(accessibilityContextDefaultValue);
  });
});
