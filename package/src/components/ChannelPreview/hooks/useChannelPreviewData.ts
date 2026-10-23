import { useCallback, useEffect } from 'react';

import type {
  Channel,
  LocalMessage,
  MembershipState,
  MessagePaginatorAggregateState,
  MessageResponse,
  MuteStatusState,
  ReadState,
  StreamChat,
} from 'stream-chat';

import { useStateStore } from '../../../hooks';

export type LastMessageType = LocalMessage | MessageResponse;

// The latest message comes from the paginator's `aggregateState`, which stays current when a new
// message lands in the head interval while an older window is active.
const lastMessageSelector = (state: MessagePaginatorAggregateState) => ({
  lastMessage: state.latestMessage ?? undefined,
});

export const useChannelPreviewData = (channel: Channel, client: StreamChat) => {
  const userId = client.userID;
  const { lastMessage } =
    useStateStore(channel.messagePaginator.aggregateState, lastMessageSelector) ?? {};

  // One `channel.state` subscription per row covers mute status, membership (pin) and own unread,
  // rather than one subscription per concern.
  const previewStateSelector = useCallback(
    (state: MembershipState & MuteStatusState & ReadState) => ({
      membership: state.membership,
      muteStatus: state.muteStatus,
      unread: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  const {
    membership,
    muteStatus,
    unread: reactiveUnread,
  } = useStateStore(channel.state, previewStateSelector) ?? {};

  const muted = muteStatus?.muted ?? false;
  const pinned = membership?.pinned_at != null;
  // Muted channels show no unread count.
  const unread = muted ? 0 : (reactiveUnread ?? 0);

  useEffect(() => {
    const unsubscribe = channel.messageComposer.registerDraftEventSubscriptions();
    return () => unsubscribe();
  }, [channel.messageComposer]);

  return { lastMessage, muted, pinned, unread };
};
