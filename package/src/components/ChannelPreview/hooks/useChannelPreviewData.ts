import { useCallback, useEffect } from 'react';

import type {
  Channel,
  LocalMessage,
  MessagePaginatorAggregateState,
  MessageResponse,
  ReadState,
  StreamChat,
} from 'stream-chat';

import { useIsChannelMuted } from './useIsChannelMuted';
import { useIsChannelPinned } from './useIsChannelPinned';

import { useStateStore } from '../../../hooks';

export type LastMessageType = LocalMessage | MessageResponse;

// The last message is sourced reactively from the paginator's `aggregateState` — a store kept
// separate from pagination `state` precisely so it stays reactive when a new message lands in the
// head interval while an older window is active (a `state`-derived latest would go stale off-window).
// The preview re-renders whenever the newest message changes (new/edited/deleted) with no manual
// event plumbing.
const lastMessageSelector = (state: MessagePaginatorAggregateState) => ({
  lastMessage: state.lastMessage ?? undefined,
});

export const useChannelPreviewData = (channel: Channel, client: StreamChat) => {
  const userId = client.userID;
  const { lastMessage } =
    useStateStore(channel.messagePaginator.aggregateState, lastMessageSelector) ?? {};
  const { muted } = useIsChannelMuted(channel);
  const pinned = useIsChannelPinned(channel);

  // unread
  const ownUnreadSelector = useCallback(
    (state: ReadState) => ({
      unread: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  const { unread: reactiveUnread } =
    useStateStore(channel.state, ownUnreadSelector) ?? {};
  // muted channels always render a zeroed unread count
  const unread = muted ? 0 : (reactiveUnread ?? 0);

  // drafts
  useEffect(() => {
    const unsubscribe = channel.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [channel.messageComposer]);

  return { lastMessage, muted, pinned, unread };
};
