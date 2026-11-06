import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useScreenReaderContext } from '../../contexts/screenReaderContext/ScreenReaderContext';

/**
 * Reads the screen-reader state from the app-wide {@link ScreenReaderContext}.
 *
 * @returns Whether a screen reader is on. False when accessibility is disabled, whatever the OS
 * reports; true when `forceScreenReaderMode` is set in the accessibility config.
 */
export const useScreenReaderEnabled = (): boolean => {
  const { enabled, forceScreenReaderMode } = useAccessibilityContext();
  const { enabled: screenReaderEnabled } = useScreenReaderContext();

  if (!enabled) return false;
  if (forceScreenReaderMode) return true;
  return screenReaderEnabled;
};
