import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAccessibilityServiceEnabled } from '../../a11y';
import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { useStateStore } from '../../hooks';
import { overlayStore } from '../../state-store/message-overlay-store';

const messageOverlayActiveSelector = (state: { id: string | undefined }) => ({
  isMessageOverlayActive: state.id !== undefined,
});

const useShouldActivateTrap = (): boolean => {
  const { enabled: a11yEnabled } = useAccessibilityContext();
  const { overlay } = useOverlayContext();
  const { isMessageOverlayActive } = useStateStore(overlayStore, messageOverlayActiveSelector);
  const a11yServiceEnabled = useAccessibilityServiceEnabled();

  return a11yEnabled && (overlay === 'gallery' || isMessageOverlayActive) && a11yServiceEnabled;
};

/**
 * Android accessibility focus trap for the overlay host's children. iOS traps focus natively with
 * `accessibilityViewIsModal` on each overlay root; Android can only mark siblings as
 * `'no-hide-descendants'`.
 *
 * Wraps `{children}` in a View that sets `importantForAccessibility='no-hide-descendants'` while an
 * overlay (the image or video gallery, or the message context menu) is open and an accessibility
 * service runs. Only the wrapper re-renders on overlay changes, since the `children` element is
 * stable. On iOS it renders only the children.
 */
export function OverlayA11yShield({ children }: PropsWithChildren) {
  const shouldActivateTrap = useShouldActivateTrap();

  if (Platform.OS !== 'android') {
    return <>{children}</>;
  }

  return (
    <View
      importantForAccessibility={shouldActivateTrap ? 'no-hide-descendants' : undefined}
      style={StyleSheet.absoluteFill}
      pointerEvents='box-none'
      testID='overlay-a11y-shield'
    >
      {children}
    </View>
  );
}
