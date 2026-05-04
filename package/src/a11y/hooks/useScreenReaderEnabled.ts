import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

/**
 * Subscribes to AccessibilityInfo screen-reader changes and returns the live state.
 * Returns false when the AccessibilityContext is disabled, regardless of the OS state,
 * so consumers don't pay the listener cost when the SDK's a11y is opted out.
 *
 * `forceScreenReaderMode: true` in the config short-circuits to true (used in tests
 * and for integrator preview).
 */
export const useScreenReaderEnabled = (): boolean => {
  const { enabled, forceScreenReaderMode } = useAccessibilityContext();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      setIsEnabled(false);
      return;
    }

    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => {
        if (!cancelled) setIsEnabled(value);
      })
      .catch(() => {
        // Some platforms / environments may not implement this; fall back to false.
      });

    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setIsEnabled);

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, [enabled]);

  if (!enabled) return false;
  if (forceScreenReaderMode) return true;
  return isEnabled;
};
