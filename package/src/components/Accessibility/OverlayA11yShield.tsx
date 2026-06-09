import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useOverlayContext } from '../../contexts/overlayContext/OverlayContext';
import { useStateStore } from '../../hooks';
import { overlayStore } from '../../state-store/message-overlay-store';

const messageOverlayActiveSelector = (state: { id: string | undefined }) => ({
  isMessageOverlayActive: state.id !== undefined,
});

/**
 * Android only accessibility focus trap for the OverlayProvider's children
 * tree. iOS handles modal focus traps natively via `accessibilityViewIsModal`
 * on each overlay's root, but Android has no equivalent prop - the only
 * JS side mechanism is to mark siblings as `'no-hide-descendants'`.
 *
 * The shield wraps `{children}` in a single View whose `importantForAccessibility`
 * flips to `'no-hide-descendants'` whenever any focus trapping overlay is
 * active (the full screen image/video gallery or the message context menu).
 * When closed, the wrapper is a transparent passthrough.
 *
 * In terms of rerendering, only the wrapper View commits new props on overlay state
 * transitions. The `{children}` element reference is stable across renders,
 * so React reconciliation does not rerender any component below the wrapper.
 *
 * On iOS the wrapper is skipped entirely.
 */
export function OverlayA11yShield({ children }: PropsWithChildren) {
  const { overlay } = useOverlayContext();
  const { isMessageOverlayActive } = useStateStore(overlayStore, messageOverlayActiveSelector);

  if (Platform.OS !== 'android') {
    return <>{children}</>;
  }

  const isAnyOverlayActive = overlay === 'gallery' || isMessageOverlayActive;

  return (
    <View
      accessibilityElementsHidden={isAnyOverlayActive}
      importantForAccessibility={isAnyOverlayActive ? 'no-hide-descendants' : 'auto'}
      style={StyleSheet.absoluteFill}
      testID='overlay-a11y-shield'
    >
      {children}
    </View>
  );
}
