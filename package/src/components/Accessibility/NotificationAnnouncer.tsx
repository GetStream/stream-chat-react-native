import { useEffect, useRef } from 'react';

import { useAccessibilityAnnouncer } from './useAccessibilityAnnouncer';

import { useAccessibilityContext } from '../../contexts/accessibilityContext/AccessibilityContext';
import { useTranslationContext } from '../../contexts/translationContext/TranslationContext';
import { useNetworkConnectionState } from '../Chat/hooks/useNetworkConnectionState';
import { useSettledWSConnectionHealth } from '../Chat/hooks/useWSConnectionState';

/**
 * Announces connection state transitions (connected, offline, reconnecting) to screen readers when
 * `accessibility.announceConnectionState` is on. Renders nothing; mount once inside `<Channel>`.
 */
export const NotificationAnnouncer = () => {
  const { announceConnectionState, enabled } = useAccessibilityContext();
  const isNetworkOnline = useNetworkConnectionState()?.isOnline;
  const isWSOnline = useSettledWSConnectionHealth();
  // Online means the WebSocket is healthy; the network state only picks the offline message.
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
