import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

/**
 * Subscribes to Android accessibility service availability and returns the live state.
 *
 * `AccessibilityInfo.isAccessibilityServiceEnabled` reports whether ANY a11y service is
 * running - TalkBack, Switch Access, Voice Access, Select to Speak, etc.  not just
 * screen readers. The signal is Android only; iOS doesn't expose it (and doesn't need to,
 * since the SDK's iOS overlay trap uses `accessibilityViewIsModal`).
 *
 * React Native does not emit a dedicated change event for this signal, so the hook
 * re-polls when the app returns to the foreground - which is the realistic path for a
 * user toggling Accessibility settings and coming back to the app. The most common
 * single service change (TalkBack on/off) is also covered by the `screenReaderChanged`
 * listener.
 *
 * Returns false on non-Android platforms without subscribing.
 * Returns false when the `AccessibilityContext` is disabled so consumers don't pay the
 * listener cost when the SDK's a11y is opted out.
 */
export const useAccessibilityServiceEnabled = (): boolean => {
  const { enabled } = useAccessibilityContext();
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) {
      setIsEnabled(false);
      return;
    }

    let cancelled = false;

    const refresh = () => {
      AccessibilityInfo.isAccessibilityServiceEnabled?.()
        .then((value) => {
          if (!cancelled) setIsEnabled(value);
        })
        .catch(() => {
          // Older RN versions / certain environments may not implement this; fall back to false.
        });
    };

    refresh();

    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      refresh,
    );

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      cancelled = true;
      screenReaderSubscription?.remove?.();
      appStateSubscription?.remove?.();
    };
  }, [enabled]);

  if (Platform.OS !== 'android' || !enabled) return false;
  return isEnabled;
};
