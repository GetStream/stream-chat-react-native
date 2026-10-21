import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, Platform } from 'react-native';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

/**
 * Tracks whether any Android accessibility service is running (TalkBack, Switch Access, Voice
 * Access and so on, not only screen readers).
 *
 * React Native emits no change event for this signal, so the state is refreshed on
 * `screenReaderChanged` and when the app returns to the foreground.
 *
 * @returns Whether a service is running. Always false on iOS and when accessibility is disabled.
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
          // The API may be unavailable in older RN versions; stay false.
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
