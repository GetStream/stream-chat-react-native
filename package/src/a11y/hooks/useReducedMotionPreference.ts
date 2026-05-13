import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

/**
 * Subscribes to AccessibilityInfo reduce-motion changes and returns the live state.
 * Returns false when the AccessibilityContext is disabled.
 */
export const useReducedMotionPreference = (): boolean => {
  const { enabled } = useAccessibilityContext();
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled) {
      setReduceMotion(false);
      return;
    }

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (!cancelled) setReduceMotion(value);
      })
      .catch(() => {
        // Older RN or platforms without the API.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, [enabled]);

  return enabled && reduceMotion;
};
