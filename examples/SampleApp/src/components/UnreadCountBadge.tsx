import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppContext } from '../context/AppContext';

const styles = StyleSheet.create({
  unreadContainer: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});

export const ThreadsUnreadCountBadge: React.FC = () => {
  const { chatClient } = useAppContext();
  const unreadCount = 0;

  return <UnreadCountBadge unreadCount={unreadCount} />;
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

  return <UnreadCountBadge unreadCount={unreadCount} />;
};

type UnreadCountBadgeProps = {
  unreadCount: number | undefined;
};

const UnreadCountBadge: React.FC<UnreadCountBadgeProps> = (props) => {
  const { unreadCount } = props;

  return (
    <View style={[styles.unreadContainer]}>
      {!!unreadCount && (
        <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
      )}
    </View>
  );
};
