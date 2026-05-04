import { useCallback, useEffect, useRef } from 'react';

import type { Channel, Event, MessageResponse } from 'stream-chat';

import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useAccessibilityAnnouncer } from '../useAccessibilityAnnouncer';

const MESSAGE_ANNOUNCEMENT_THROTTLE_MS = 1000;

const isAnnounceableIncomingMessage = (message: MessageResponse, ownUserId?: string): boolean => {
  const messageUserId = message.user?.id;
  if (!message.id || !messageUserId || messageUserId === ownUserId) return false;
  return (
    message.type !== 'deleted' &&
    message.type !== 'ephemeral' &&
    message.type !== 'error' &&
    message.type !== 'system' &&
    message.status !== 'failed' &&
    message.status !== 'sending'
  );
};

const getSenderName = (
  message: MessageResponse,
  t: ReturnType<typeof useTranslationContext>['t'],
) => message.user?.name?.trim() || message.user?.id || t('Anonymous');

export type UseIncomingMessageAnnouncementsParams = {
  activeThreadId?: string;
  channel?: Channel;
  ownUserId?: string;
  threadList?: boolean;
};

/**
 * Mirrors stream-chat-react's `useIncomingMessageAnnouncements`:
 *  - 1 message → "New message from {{user}}"
 *  - >1 messages within throttle window → "{{count}} new messages"
 *  - Throttled to one announcement per second
 *  - Bounded `announcedMessageIds` set so a long-running session does not leak.
 *
 * Subscribes to `channel.on('message.new')`. When AccessibilityContext.enabled
 * is false OR `announceNewMessages` is false, the hook is a no-op (no
 * subscription is opened, no listener cost is paid).
 */
export const useIncomingMessageAnnouncements = ({
  activeThreadId,
  channel,
  ownUserId,
  threadList = false,
}: UseIncomingMessageAnnouncementsParams) => {
  const { announceNewMessages, enabled } = useAccessibilityContext();
  const announce = useAccessibilityAnnouncer();
  const { t } = useTranslationContext();
  const lastAnnouncementTimestampRef = useRef(0);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const announcedMessageIdsRef = useRef(new Set<string>());
  const pendingAnnouncementBatchRef = useRef<{ count: number; firstSender: string | null }>({
    count: 0,
    firstSender: null,
  });

  const flushPendingAnnouncements = useCallback(() => {
    const pending = pendingAnnouncementBatchRef.current;
    if (pending.count <= 0) return;

    if (pending.count === 1) {
      announce(
        t('aria/New message from {{user}}', {
          user: pending.firstSender || t('Anonymous'),
        }),
      );
    } else {
      announce(t('aria/{{count}} new messages', { count: pending.count }));
    }

    pending.count = 0;
    pending.firstSender = null;
    lastAnnouncementTimestampRef.current = Date.now();
  }, [announce, t]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) return;
    const now = Date.now();
    const elapsed = now - lastAnnouncementTimestampRef.current;
    if (elapsed >= MESSAGE_ANNOUNCEMENT_THROTTLE_MS) {
      flushPendingAnnouncements();
      return;
    }
    flushTimeoutRef.current = setTimeout(() => {
      flushTimeoutRef.current = undefined;
      flushPendingAnnouncements();
    }, MESSAGE_ANNOUNCEMENT_THROTTLE_MS - elapsed);
  }, [flushPendingAnnouncements]);

  useEffect(
    () => () => {
      if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !announceNewMessages || !channel) return;

    const handleMessageNew = (event: Event) => {
      const message = event.message;
      if (!message) return;
      if (
        (event.cid && event.cid !== channel.cid) ||
        !isAnnounceableIncomingMessage(message, ownUserId)
      ) {
        return;
      }

      const isReply = !!message.parent_id;
      const belongsToActiveThread = !!activeThreadId && message.parent_id === activeThreadId;
      const shouldAnnounceInThreadList = threadList && belongsToActiveThread;
      const shouldAnnounceInMainList = !threadList && !isReply;
      if (!shouldAnnounceInThreadList && !shouldAnnounceInMainList) return;

      if (announcedMessageIdsRef.current.has(message.id || '')) return;
      if (message.id) {
        if (announcedMessageIdsRef.current.size > 500) {
          announcedMessageIdsRef.current.clear();
        }
        announcedMessageIdsRef.current.add(message.id);
      }

      pendingAnnouncementBatchRef.current.count += 1;
      if (!pendingAnnouncementBatchRef.current.firstSender) {
        pendingAnnouncementBatchRef.current.firstSender = getSenderName(message, t);
      }

      scheduleFlush();
    };

    const subscription = channel.on('message.new', handleMessageNew);
    return () => {
      subscription.unsubscribe();
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = undefined;
      }
    };
  }, [
    activeThreadId,
    announceNewMessages,
    channel,
    enabled,
    ownUserId,
    scheduleFlush,
    t,
    threadList,
  ]);
};
