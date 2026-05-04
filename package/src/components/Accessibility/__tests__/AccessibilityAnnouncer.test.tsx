import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { renderHook, waitFor } from '@testing-library/react-native';

import { AccessibilityAnnouncer } from '../AccessibilityAnnouncer';
import { useAccessibilityAnnouncer } from '../useAccessibilityAnnouncer';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';

jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  __esModule: true,
  default: {
    announceForAccessibility: jest.fn(),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  },
}));

const wrapper =
  (enabled: boolean) =>
  ({ children }: { children: React.ReactNode }) => (
    <AccessibilityProvider value={{ enabled }}>
      <AccessibilityAnnouncer>{children}</AccessibilityAnnouncer>
    </AccessibilityProvider>
  );

describe('AccessibilityAnnouncer', () => {
  beforeEach(() => {
    (AccessibilityInfo.announceForAccessibility as jest.Mock).mockClear();
  });

  it('returns a no-op when enabled is false', async () => {
    const { result } = renderHook(() => useAccessibilityAnnouncer(), { wrapper: wrapper(false) });
    result.current('hello');
    await new Promise((r) => setTimeout(r, 80));
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });

  it('announces via AccessibilityInfo when enabled', async () => {
    const { result } = renderHook(() => useAccessibilityAnnouncer(), { wrapper: wrapper(true) });
    result.current('hello');
    await waitFor(() =>
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('hello'),
    );
  });

  it('flushes only the latest message per priority within the debounce window', async () => {
    const { result } = renderHook(() => useAccessibilityAnnouncer(), { wrapper: wrapper(true) });
    result.current('first');
    result.current('second');
    result.current('third');
    await waitFor(() =>
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('third'),
    );
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalledWith('first');
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalledWith('second');
  });

  it('ignores empty messages', async () => {
    const { result } = renderHook(() => useAccessibilityAnnouncer(), { wrapper: wrapper(true) });
    result.current('');
    await new Promise((r) => setTimeout(r, 80));
    expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
  });
});
