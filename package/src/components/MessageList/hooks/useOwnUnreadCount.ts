import { useMemo } from 'react';

import type { Channel, ReadState } from 'stream-chat';

import { useChatContext } from '../../../contexts/chatContext/ChatContext';
import { useStateStore } from '../../../hooks/useStateStore';

/**
 * The current user's unread message count in `channel`, kept current as reads arrive. `undefined`
 * when no channel is given, which also leaves the channel's state unsubscribed.
 */
export const useOwnUnreadCount = (channel: Channel | undefined) => {
  const { client } = useChatContext();
  const userId = client?.userID;
  const selector = useMemo(
    () => (state: ReadState) => ({
      unreadCount: userId ? (state.read[userId]?.unread_messages ?? 0) : 0,
    }),
    [userId],
  );
  return useStateStore(channel?.state, selector)?.unreadCount;
};
