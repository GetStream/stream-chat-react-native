import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from './useAccessibilityAnnouncer';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useNetworkConnectionState } from '../Chat/hooks/useNetworkConnectionState';
import { useSettledWSConnectionHealth } from '../Chat/hooks/useWSConnectionState';

/**
 * Mirrors stream-chat-react's `<NotificationAnnouncer />`. RN does not yet have a
 * unified Notification queue, so this component currently announces only
 * connection-state transitions (offline → online and back) gated on
 * `accessibility.announceConnectionState`. Per-channel error announcements can
 * be wired in by a future PR via `useChannelContext().error`.
 *
 * Renders nothing. Mount once inside `<Channel>` (or wherever the active chat
 * surface lives).
 */
export const NotificationAnnouncer = () => {
  const { announceConnectionState, enabled } = useAccessibilityContext();
  const isNetworkOnline = useNetworkConnectionState()?.isOnline;
  const isWSOnline = useSettledWSConnectionHealth();
  // The socket is what 'connected' means to a chat user; the device network only decides which
  // of the two offline messages is truthful.
  const isOnline = !!isWSOnline;
  const announce = useAccessibilityAnnouncer();
  const { t } = useTranslationContext();
  const previousIsOnlineRef = useRef<boolean | null | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !announceConnectionState) return;
    if (previousIsOnlineRef.current === undefined) {
      previousIsOnlineRef.current = isOnline;
      return;
    }
    if (previousIsOnlineRef.current === isOnline) return;
    previousIsOnlineRef.current = isOnline;

    if (isOnline) {
      announce(t('a11y.connection.connected.accessibilityLabel', 'Connected'), 'polite');
    } else {
      announce(
        isNetworkOnline === false
          ? t('a11y.connection.offline.accessibilityLabel', 'Offline')
          : t('a11y.connection.reconnecting.accessibilityLabel', 'Reconnecting'),
        'assertive',
      );
    }
  }, [announce, announceConnectionState, enabled, isNetworkOnline, isOnline, t]);

  return null;
};
