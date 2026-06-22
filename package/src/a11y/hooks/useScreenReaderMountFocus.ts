import { useEffect } from 'react';

import { useScreenReaderEnabled } from './useScreenReaderEnabled';
import {
  type AccessibilityFocusTarget,
  useSetAccessibilityFocus,
} from './useSetAccessibilityFocus';

/**
 * Moves the screen reader cursor onto `target` as it mounts (and refires once the
 * screen reader state resolves, since that is detected asynchronously). Like
 * {@link useSetAccessibilityFocus}, it only moves accessibility focus.
 */
export const useScreenReaderMountFocus = (target: AccessibilityFocusTarget) => {
  const setAccessibilityFocus = useSetAccessibilityFocus();
  const screenReaderEnabled = useScreenReaderEnabled();

  useEffect(() => {
    setAccessibilityFocus(target);
  }, [screenReaderEnabled, setAccessibilityFocus, target]);
};
