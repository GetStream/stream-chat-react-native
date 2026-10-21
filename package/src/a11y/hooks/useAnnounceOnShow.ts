import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from '../../components/Accessibility/useAccessibilityAnnouncer';

type Options = {
  /** Delay before the announcement fires; lets entrance animations settle. */
  delayMs?: number;
  priority?: 'polite' | 'assertive';
};

/**
 * Announces `message` each time `visible` flips from false to true, for transient surfaces such as
 * modals and bottom sheets. Hiding the surface re-arms the announcement. Does nothing while
 * `message` is `undefined`.
 *
 * @param visible Whether the surface is shown.
 * @param message Text to announce.
 * @param params.delayMs Delay before announcing. Defaults to 500.
 * @param params.priority Announcement priority. Defaults to `polite`.
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
