import React from 'react';
import { Platform, Text } from 'react-native';

import { act, render, screen } from '@testing-library/react-native';

import { OverlayContext } from '../../../contexts/overlayContext/OverlayContext';
import { overlayStore } from '../../../state-store/message-overlay-store';
import { OverlayA11yShield } from '../OverlayA11yShield';

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
};

const renderShield = (overlay: 'none' | 'gallery' = 'none') =>
  render(
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
    </OverlayContext.Provider>,
  );

// The wrapper sets `accessibilityElementsHidden` / `importantForAccessibility`
// when an overlay is active — RTL v13 filters those elements out of a11y queries
// by default. `includeHiddenElements: true` keeps them queryable for assertion.
const wrapper = () => screen.queryByTestId('overlay-a11y-shield', { includeHiddenElements: true });

describe('OverlayA11yShield', () => {
  const originalOS = Platform.OS;
  afterAll(() => setPlatform(originalOS));

  beforeEach(() => {
    act(() => {
      overlayStore.partialNext({ closing: false, id: undefined, messageId: undefined });
    });
  });

  describe('on Android', () => {
    beforeAll(() => setPlatform('android'));

    it('renders children inside the wrapper', () => {
      renderShield();
      expect(screen.getByTestId('child')).toBeTruthy();
      expect(wrapper()).toBeTruthy();
    });

    it('does not hide descendants when no overlay is active', () => {
      renderShield('none');
      expect(wrapper()?.props.importantForAccessibility).toBe('auto');
    });

    it('hides descendants when the gallery overlay is active', () => {
      renderShield('gallery');
      expect(wrapper()?.props.importantForAccessibility).toBe('no-hide-descendants');
    });

    it('hides descendants when the message overlay opens', () => {
      renderShield('none');
      act(() => {
        overlayStore.partialNext({ id: 'msg-1' });
      });
      expect(wrapper()?.props.importantForAccessibility).toBe('no-hide-descendants');
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
