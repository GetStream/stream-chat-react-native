import React from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

import { act, render, screen, waitFor } from '@testing-library/react-native';

import { AccessibilityProvider } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { OverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { overlayStore } from '../../../state-store/message-overlay-store';
import { OverlayA11yShield } from '../OverlayA11yShield';

jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    announceForAccessibility: jest.fn(),
    isAccessibilityServiceEnabled: jest.fn().mockResolvedValue(true),
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
  },
}));

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
};

const renderShield = (overlay: 'none' | 'gallery' = 'none') =>
  render(
    <AccessibilityProvider value={{ enabled: true }}>
      <OverlayContext.Provider
        value={
          {
            overlay,
            setOverlay: () => undefined,
            style: undefined,
          } as never
        }
      >
        <OverlayA11yShield>
          <Text testID='child'>child</Text>
        </OverlayA11yShield>
      </OverlayContext.Provider>
    </AccessibilityProvider>,
  );

// The wrapper sets `accessibilityElementsHidden` / `importantForAccessibility`
// when an overlay is active — RTL v13 filters those elements out of a11y queries
// by default. `includeHiddenElements: true` keeps them queryable for assertion.
const wrapper = () => screen.queryByTestId('overlay-a11y-shield', { includeHiddenElements: true });

describe('OverlayA11yShield', () => {
  const originalOS = Platform.OS;
  afterAll(() => setPlatform(originalOS));

  beforeEach(() => {
    (AccessibilityInfo.isAccessibilityServiceEnabled as jest.Mock).mockResolvedValue(true);
    act(() => {
      overlayStore.partialNext({ closing: false, id: undefined, messageId: undefined });
    });
  });

  describe('on Android', () => {
    beforeAll(() => setPlatform('android'));

    it('renders children inside the wrapper', async () => {
      renderShield();
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByTestId('child')).toBeTruthy();
      expect(wrapper()).toBeTruthy();
    });

    it('does not hide descendants when no overlay is active', async () => {
      renderShield('none');
      await act(async () => {
        await Promise.resolve();
      });
      expect(wrapper()?.props.importantForAccessibility).toBeUndefined();
    });

    it('hides descendants when the gallery overlay is active and an a11y service is on', async () => {
      renderShield('gallery');
      await waitFor(() => {
        expect(wrapper()?.props.importantForAccessibility).toBe('no-hide-descendants');
      });
    });

    it('hides descendants when the message overlay opens and an a11y service is on', async () => {
      renderShield('none');
      act(() => {
        overlayStore.partialNext({ id: 'msg-1' });
      });
      await waitFor(() => {
        expect(wrapper()?.props.importantForAccessibility).toBe('no-hide-descendants');
      });
    });

    it('does not flip the prop when no a11y service is running, even with an overlay active', async () => {
      (AccessibilityInfo.isAccessibilityServiceEnabled as jest.Mock).mockResolvedValue(false);
      renderShield('gallery');
      // Allow the async isAccessibilityServiceEnabled() resolution to settle.
      await act(async () => {
        await Promise.resolve();
      });
      expect(wrapper()?.props.importantForAccessibility).toBeUndefined();
    });
  });

  describe('on iOS', () => {
    beforeAll(() => setPlatform('ios'));

    it('renders children without a wrapper', () => {
      renderShield();
      expect(screen.getByTestId('child')).toBeTruthy();
      expect(wrapper()).toBeNull();
    });
  });
});
