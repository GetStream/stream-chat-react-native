import React, { PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilityContext } from '../accessibilityContext/AccessibilityContext';

export type ScreenReaderContextValue = {
  /** Whether an OS screen reader (VoiceOver or TalkBack) is active. */
  enabled: boolean;
};

const DEFAULT_SCREEN_READER_CONTEXT_VALUE: ScreenReaderContextValue = { enabled: false };

export const ScreenReaderContext = React.createContext<ScreenReaderContextValue>(
  DEFAULT_SCREEN_READER_CONTEXT_VALUE,
);

/**
 * Owns the app-wide screen reader subscription, so consumers read one boolean from context instead
 * of each attaching a listener. Nothing is queried or subscribed while the SDK's a11y is disabled.
 */
export const ScreenReaderProvider = ({ children }: PropsWithChildren) => {
  const { enabled: a11yEnabled } = useAccessibilityContext();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    if (!a11yEnabled) {
      setScreenReaderEnabled(false);
      return;
    }

    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((value) => {
        if (!cancelled) setScreenReaderEnabled(value);
      })
      .catch(() => {
        // Some platforms do not implement this; stay at false.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled,
    );

    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, [a11yEnabled]);

  const value = useMemo<ScreenReaderContextValue>(
    () => ({ enabled: screenReaderEnabled }),
    [screenReaderEnabled],
  );

  return <ScreenReaderContext.Provider value={value}>{children}</ScreenReaderContext.Provider>;
};

export const useScreenReaderContext = (): ScreenReaderContextValue =>
  useContext(ScreenReaderContext);
