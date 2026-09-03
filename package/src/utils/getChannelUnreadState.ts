import type { Channel } from 'stream-chat';

import type { ChannelUnreadState } from '../types/types';

/**
 * Maps the LLC's `channel.messagePaginator.unreadStateSnapshot` (the single source of truth for
 * unread state) into the SDK's `ChannelUnreadState` shape used across the message list.
 *
 * Returns `undefined` when there is nothing unread to represent (no first-unread marker, no
 * last-read message, no unread count) — mirroring the previous store's "empty means undefined"
 * semantics so downstream `channelUnreadState?.x` checks behave identically. `last_read` falls back
 * to the epoch (whole channel unread) exactly as before.
 */
export const getChannelUnreadState = (channel: Channel): ChannelUnreadState | undefined => {
  const snapshot = channel.messagePaginator.unreadStateSnapshot.getLatestValue();

  if (!snapshot.firstUnreadMessageId && !snapshot.lastReadMessageId && !snapshot.unreadCount) {
    return undefined;
  }

  return {
    first_unread_message_id: snapshot.firstUnreadMessageId ?? undefined,
    last_read: snapshot.lastReadAt ?? 0,
    last_read_message_id: snapshot.lastReadMessageId ?? undefined,
    unread_messages: snapshot.unreadCount,
  };
};
