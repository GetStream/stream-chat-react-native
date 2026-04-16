import React, { useEffect, useState } from 'react';
import { BadgeNotification, useStateStore } from 'stream-chat-react-native';

import { useAppContext } from '../context/AppContext';
import { ThreadManagerState } from 'stream-chat';

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
   * Listen to changes in unread counts and update the badge count
   */
  useEffect(() => {
    const listener = chatClient?.on((e) => {
      const event = e.me ?? e;
      if (event.total_unread_count !== undefined) {
        setUnreadCount(event.total_unread_count);
      } else {
        if (Object.keys(chatClient?.activeChannels).length > 0) {
          const countUnread = Object.values(chatClient.activeChannels).reduce(
            (count, channel) => count + channel.countUnread(),
            0,
          );
          setUnreadCount(countUnread);
        }
      }
    });

    return () => {
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [chatClient]);

  if (unreadCount === 0) {
    return null;
  }

  return <BadgeNotification count={unreadCount} size='md' type='primary' />;
};
