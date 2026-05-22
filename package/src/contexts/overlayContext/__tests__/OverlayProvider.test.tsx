import React from 'react';
import { AccessibilityInfo } from 'react-native';

import { renderHook, waitFor } from '@testing-library/react-native';

import { useAccessibilityAnnouncer } from '../../../components/Accessibility/useAccessibilityAnnouncer';
import { useAccessibilityContext } from '../../accessibilityContext/AccessibilityContext';
import { OverlayProvider } from '../OverlayProvider';

jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    announceForAccessibility: jest.fn(),
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
  },
}));

describe('OverlayProvider accessibility', () => {
  beforeEach(() => {
    (AccessibilityInfo.announceForAccessibility as jest.Mock).mockClear();
  });

  it('provides accessibility config and announcer to descendants', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OverlayProvider accessibility={{ audioRecorderTapMode: 'always', enabled: true }}>
        {children}
      </OverlayProvider>
    );

    const { result } = renderHook(
      () => ({
        announce: useAccessibilityAnnouncer(),
        accessibility: useAccessibilityContext(),
      }),
      { wrapper },
    );

    expect(result.current.accessibility.enabled).toBe(true);
    expect(result.current.accessibility.audioRecorderTapMode).toBe('always');

    result.current.announce('overlay announcement');

    await waitFor(() =>
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'overlay announcement',
      ),
    );
  });
});
