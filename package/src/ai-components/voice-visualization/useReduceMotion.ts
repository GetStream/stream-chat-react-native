import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the system asks for less motion: Reduce Motion on iOS, animations off on Android. It
 * follows the setting while mounted.
 *
 * The AI entry point cannot reach the core SDK's own hook, which also only applies once its
 * accessibility layer is enabled; the voice visualizations always honour the setting, as on iOS
 * and Android.
 */
export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((enabled) => {
        // It starts off; only turning it on needs a render.
        if (mounted && enabled) setReduceMotion(true);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reduceMotion;
};
