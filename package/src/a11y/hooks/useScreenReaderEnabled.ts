import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useScreenReaderContext } from '../../contexts/screenReaderContext/ScreenReaderContext';

/**
 * Returns the live screen-reader state from the app-wide {@link ScreenReaderContext}.
 * Returns false when the AccessibilityContext is disabled, regardless of the OS state,
 * so consumers don't pay the listener cost when the SDK's a11y is opted out.
 *
 * `forceScreenReaderMode: true` in the config short-circuits to true (used in tests
 * and for integrator preview).
 */
export const useScreenReaderEnabled = (): boolean => {
  const { enabled, forceScreenReaderMode } = useAccessibilityContext();
  const { enabled: screenReaderEnabled } = useScreenReaderContext();

  if (!enabled) return false;
  if (forceScreenReaderMode) return true;
  return screenReaderEnabled;
};
