import React, { useEffect, useState } from 'react';

import { ThreadManagerState } from 'stream-chat';
import { BadgeNotification, useStateStore } from 'stream-chat-react-native';

import { useAppContext } from '../context/AppContext';

const selector = (nextValue: ThreadManagerState) =>
  ({ unreadCount: nextValue.unreadThreadCount }) as const;

export const ThreadsUnreadCountBadge: React.FC = () => {
  const { chatClient } = useAppContext();
  const { unreadCount } = useStateStore(chatClient?.threads?.state, selector) ?? { unreadCount: 0 };

  if (unreadCount === 0) {
    return null;
  }

  return <BadgeNotification count={unreadCount} size='md' type='primary' />;
};

export const ChannelsUnreadCountBadge: React.FC = () => {
  const { chatClient } = useAppContext();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  /**
   * Listen to changes in unread counts and update the badge count.
   *
   * We deliberately derive the total from each channel's local `countUnread()` (a sum over the
   * loaded/active channels) rather than the server-sent `event.total_unread_count`. The local count
   * respects the "viewing live" gate — the channel the user is currently reading at the bottom stays
   * at 0 — so the badge does NOT flicker when a message arrives in the active channel. The server
   * total, by contrast, briefly counts that message until the mark-read round-trips.
   */
  useEffect(() => {
    if (!chatClient) {
      return;
    }
    const computeUnreadCount = () =>
      Object.values(chatClient.activeChannels).reduce(
        (count, channel) => count + (channel?.countUnread() ?? 0),
        0,
      );

    setUnreadCount(computeUnreadCount());
    const listener = chatClient.on(() => {
      setUnreadCount(computeUnreadCount());
    });

    return () => {
      listener.unsubscribe();
    };
  }, [chatClient]);

  if (unreadCount === 0) {
    return null;
  }

  return <BadgeNotification count={unreadCount} size='md' type='primary' />;
};
