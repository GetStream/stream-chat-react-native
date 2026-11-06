import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

/**
 * Tracks the OS reduce-motion setting.
 *
 * @returns Whether reduce motion is on. Always false when accessibility is disabled.
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
        // The API may be unavailable on some platforms; stay false.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, [enabled]);

  return enabled && reduceMotion;
};
