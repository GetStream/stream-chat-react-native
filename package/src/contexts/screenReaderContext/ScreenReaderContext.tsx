import React, { PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useAccessibilityContext } from '../accessibilityContext/AccessibilityContext';

export type ScreenReaderContextValue = {
  /** True when an OS screen reader (VoiceOver / TalkBack) is currently active. */
  enabled: boolean;
};

const DEFAULT_SCREEN_READER_CONTEXT_VALUE: ScreenReaderContextValue = { enabled: false };

export const ScreenReaderContext = React.createContext<ScreenReaderContextValue>(
  DEFAULT_SCREEN_READER_CONTEXT_VALUE,
);

/**
 * Owns the single, app wide screen reader subscription. One `isScreenReaderEnabled()`
 * query and one `screenReaderChanged` listener for the whole tree; every consumer reads
 * the resulting boolean from context instead of attaching its own listener per mount.
 *
 * Gated on the AccessibilityContext `enabled` flag: when the SDK's a11y is opted out, no
 * query is made and no listener is attached.
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
        // Some platforms / environments may not implement this; fall back to false.
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
