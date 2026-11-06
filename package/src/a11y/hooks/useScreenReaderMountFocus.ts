import { useEffect } from 'react';

import { useScreenReaderEnabled } from './useScreenReaderEnabled';
import {
  type AccessibilityFocusTarget,
  useSetAccessibilityFocus,
} from './useSetAccessibilityFocus';

/**
 * Moves the screen reader cursor onto `target` on mount, and again once the asynchronously detected
 * screen reader state resolves. Like {@link useSetAccessibilityFocus}, it only moves focus.
 *
 * @param target The ref or native node handle to focus.
 */
export const useScreenReaderMountFocus = (target: AccessibilityFocusTarget) => {
  const setAccessibilityFocus = useSetAccessibilityFocus();
  const screenReaderEnabled = useScreenReaderEnabled();

  useEffect(() => {
    setAccessibilityFocus(target);
  }, [screenReaderEnabled, setAccessibilityFocus, target]);
};
