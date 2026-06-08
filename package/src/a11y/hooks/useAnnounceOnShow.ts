import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';

type Options = {
  /** Delay before the announcement fires; lets entrance animations settle. */
  delayMs?: number;
  priority?: 'polite' | 'assertive';
};

/**
 * Announces `message` once each time `visible` flips from false to true.
 * Resets when `visible` flips back to false, so the next show re-announces —
 * unlike `useAnnounceOnStateChange`, which announces on string change and
 * dedupes consecutive identical strings.
 *
 * Use this for transient surfaces that appear and disappear repeatedly within
 * a session (modals, autocomplete pickers, bottom sheets) where the user
 * benefits from hearing the affordance on every reappearance.
 *
 * When `message` is undefined (typically because `useA11yLabel` returned
 * undefined — a11y disabled or key missing), the hook is a no-op.
 */
export const useAnnounceOnShow = (
  visible: boolean,
  message: string | undefined,
  { delayMs = 500, priority = 'polite' }: Options = {},
) => {
  const announce = useAccessibilityAnnouncer();
  const announcedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      announcedRef.current = false;
      return;
    }
    if (!message || announcedRef.current) return;
    const id = setTimeout(() => {
      announce(message, priority);
      announcedRef.current = true;
    }, delayMs);
    return () => clearTimeout(id);
  }, [visible, message, announce, priority, delayMs]);
};
