import { useCallback, useEffect, useRef } from 'react';

import type { Channel, EventPayload, LocalMessage, MessageResponse } from 'stream-chat';

import { useAccessibilityContext } from '../../../contexts/accessibilityContext/AccessibilityContext';
import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import { useAccessibilityAnnouncer } from '../useAccessibilityAnnouncer';

const MESSAGE_ANNOUNCEMENT_THROTTLE_MS = 1000;

const isAnnounceableIncomingMessage = (
  message: MessageResponse | LocalMessage,
  ownUserId?: string,
): boolean => {
  const messageUserId = message.user?.id;
  if (!message.id || !messageUserId || messageUserId === ownUserId) return false;
  // `status` only exists on `LocalMessage`, not on a bare `MessageResponse`.
  const status = 'status' in message ? message.status : undefined;
  return (
    message.type !== 'deleted' &&
    message.type !== 'ephemeral' &&
    message.type !== 'error' &&
    message.type !== 'system' &&
    status !== 'failed' &&
    status !== 'sending'
  );
};

const getSenderName = (
  message: MessageResponse,
  t: ReturnType<typeof useTranslationContext>['t'],
) => message.user?.name?.trim() || message.user?.id || t('common.anonymousUser.label', 'Anonymous');

export type UseIncomingMessageAnnouncementsParams = {
  /** Set when the list is a thread's reply list: only that thread's replies are announced. */
  activeThreadId?: string;
  channel?: Channel;
  ownUserId?: string;
};

/**
 * Announces new messages from other users to screen readers: "New message from {{user}}" for one,
 * "{{count}} new messages" for several within the one second throttle window.
 *
 * Does nothing, and opens no subscription, unless accessibility and `announceNewMessages` are
 * enabled. Announced message IDs are tracked to skip duplicates and cleared past 500 entries.
 *
 * @param params.activeThreadId The open thread, if any. Only its replies are announced; without
 * it only non-reply messages are.
 * @param params.channel The channel whose `message.new` events are observed.
 * @param params.ownUserId The current user's ID. Their own messages are not announced.
 */
export const useIncomingMessageAnnouncements = ({
  activeThreadId,
  channel,
  ownUserId,
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
        t('a11y.newMessage.withUser.accessibilityLabel', 'New message from {{user}}', {
          user: pending.firstSender || t('common.anonymousUser.label', 'Anonymous'),
        }),
      );
    } else {
      announce(
        t('a11y.newMessages.withCount.accessibilityLabel', '{{count}} new messages', {
          count: pending.count,
        }),
      );
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

    const handleMessageNew = (event: EventPayload<'message.new'>) => {
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
      const shouldAnnounceInThreadList = belongsToActiveThread;
      const shouldAnnounceInMainList = !activeThreadId && !isReply;
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
  }, [activeThreadId, announceNewMessages, channel, enabled, ownUserId, scheduleFlush, t]);
};
