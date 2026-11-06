import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';
import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';

const DEFAULT_DEBOUNCE_MS = 250;

type UseAnnounceOnStateChangeOptions = {
  debounceMs?: number;
  priority?: 'polite' | 'assertive';
};

/**
 * Announces `message` whenever it changes to a new non-empty value, debounced so rapid transitions
 * do not flood the screen reader. Repeating the last announced message is skipped.
 *
 * @param message Text to announce.
 * @param options.debounceMs Debounce before announcing. Defaults to 250.
 * @param options.priority Announcement priority. Defaults to `polite`.
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
