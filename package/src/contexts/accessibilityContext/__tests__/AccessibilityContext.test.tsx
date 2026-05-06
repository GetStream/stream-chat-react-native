import React from 'react';

import { render, renderHook } from '@testing-library/react-native';

import {
  AccessibilityConfig,
  AccessibilityProvider,
  ResolvedAccessibilityConfig,
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

  it('keeps the resolved value stable when equivalent config objects are recreated', () => {
    const contextValues: ResolvedAccessibilityConfig[] = [];

    const ContextValueProbe = () => {
      contextValues.push(useAccessibilityContext());
      return null;
    };

    const renderProvider = (value: AccessibilityConfig) => (
      <AccessibilityProvider value={value}>
        <ContextValueProbe />
      </AccessibilityProvider>
    );

    const { rerender } = render(renderProvider({ audioRecorderTapMode: 'always', enabled: true }));
    const firstValue = contextValues[contextValues.length - 1];

    rerender(renderProvider({ audioRecorderTapMode: 'always', enabled: true }));
    const secondValue = contextValues[contextValues.length - 1];

    expect(secondValue).toBe(firstValue);
  });
});
