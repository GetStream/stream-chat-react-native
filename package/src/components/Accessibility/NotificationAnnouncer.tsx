import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from './useAccessibilityAnnouncer';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';

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
  const { connectionRecovering, isOnline } = useChatContext();
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
      announce(t('aria/Connected'), 'polite');
    } else {
      announce(connectionRecovering ? t('aria/Reconnecting') : t('aria/Offline'), 'assertive');
    }
  }, [announce, announceConnectionState, connectionRecovering, enabled, isOnline, t]);

  return null;
};
