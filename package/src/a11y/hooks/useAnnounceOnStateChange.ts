import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';

const DEFAULT_DEBOUNCE_MS = 250;

/**
 * Announces `message` whenever it changes (and is non-empty), with a debounce
 * to avoid spamming the screen reader on rapid transitions.
 *
 * Used by `AITypingIndicatorView` ("Thinking…" → "Generating…" → idle) and
 * the `Indicators` family (loading → loaded → error).
 */
export const useAnnounceOnStateChange = (
  message: string | null | undefined,
  options: { debounceMs?: number; priority?: 'polite' | 'assertive' } = {},
) => {
  const { debounceMs = DEFAULT_DEBOUNCE_MS, priority = 'polite' } = options;
  const announce = useAccessibilityAnnouncer();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnouncedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message || message === lastAnnouncedRef.current) return;

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
  }, [announce, debounceMs, message, priority]);
};
