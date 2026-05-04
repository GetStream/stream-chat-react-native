import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import {
  AccessibilityAnnounce,
  AccessibilityAnnouncerContext,
  AccessibilityAnnouncePriority,
} from './useAccessibilityAnnouncer';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

const ANNOUNCE_DEBOUNCE_MS = 50;

type SequenceByPriority = { [key in AccessibilityAnnouncePriority]: number };
type TimeoutByPriority = {
  [key in AccessibilityAnnouncePriority]: ReturnType<typeof setTimeout> | undefined;
};

/**
 * Provider that exposes an imperative announcer mirroring stream-chat-react's
 * `AriaLiveRegion`. On RN, both iOS and Android use the imperative
 * `AccessibilityInfo.announceForAccessibility` (RN's cross-platform announcer);
 * the sequence/debounce pattern is preserved so repeat announcements with the
 * same text still fire (otherwise screen readers may swallow them).
 *
 * No-op when AccessibilityContext.enabled is false — children are returned
 * untouched and no listeners or context are attached.
 */
export const AccessibilityAnnouncer = ({ children }: PropsWithChildren) => {
  const { enabled } = useAccessibilityContext();
  const sequenceByPriorityRef = useRef<SequenceByPriority>({ assertive: 0, polite: 0 });
  const timeoutByPriorityRef = useRef<TimeoutByPriority>({
    assertive: undefined,
    polite: undefined,
  });
  const unmountedRef = useRef(false);

  const clearPendingTimeout = useCallback((priority: AccessibilityAnnouncePriority) => {
    if (!timeoutByPriorityRef.current[priority]) return;
    clearTimeout(timeoutByPriorityRef.current[priority]);
    timeoutByPriorityRef.current[priority] = undefined;
  }, []);

  const announce = useCallback<AccessibilityAnnounce>(
    (message, priority = 'polite') => {
      if (!message) return;
      const sequence = sequenceByPriorityRef.current[priority] + 1;
      sequenceByPriorityRef.current[priority] = sequence;
      clearPendingTimeout(priority);
      timeoutByPriorityRef.current[priority] = setTimeout(() => {
        if (unmountedRef.current) return;
        if (sequenceByPriorityRef.current[priority] !== sequence) return;
        AccessibilityInfo.announceForAccessibility(message);
        timeoutByPriorityRef.current[priority] = undefined;
      }, ANNOUNCE_DEBOUNCE_MS);
    },
    [clearPendingTimeout],
  );

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      clearPendingTimeout('assertive');
      clearPendingTimeout('polite');
    };
  }, [clearPendingTimeout]);

  const contextValue = useMemo(() => ({ announce }), [announce]);

  if (!enabled) return <>{children}</>;

  return (
    <AccessibilityAnnouncerContext.Provider value={contextValue}>
      {children}
    </AccessibilityAnnouncerContext.Provider>
  );
};
