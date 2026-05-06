import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';
import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

const DEFAULT_DEBOUNCE_MS = 250;

type UseAnnounceOnStateChangeOptions = {
  debounceMs?: number;
  priority?: 'polite' | 'assertive';
};

/**
 * Announces `message` whenever it changes (and is non-empty), with a debounce
 * to avoid spamming the screen reader on rapid transitions.
 *
 * Used by `AITypingIndicatorView` ("Thinking…" → "Generating…" → idle) and
 * the `Indicators` family (loading → loaded → error).
 */
export const useAnnounceOnStateChange = (
  message: string | null | undefined,
  options: UseAnnounceOnStateChangeOptions = {},
) => {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, priority = 'polite' } = options;
  const { enabled } = useAccessibilityContext();
  const announce = useAccessibilityAnnouncer();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !message || message === lastAnnouncedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      announce(message, priority);
      lastAnnouncedRef.current = message;
      timeoutRef.current = null;
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [announce, debounceMs, enabled, message, priority]);
};
