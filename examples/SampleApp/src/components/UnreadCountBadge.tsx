import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { isOwnUser } from 'stream-chat';
import { useTheme } from 'stream-chat-react-native';

import { AppContext } from '../context/AppContext';

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

export const UnreadCountBadge: React.FC = () => {
  const {
    theme: {
      colors: { accent_red },
    },
  } = useTheme();

  const { chatClient } = useContext(AppContext);
  const [count, setCount] = useState<number>();

  useEffect(() => {
    const user = chatClient?.user;
    const unreadCount = isOwnUser(user) ? user.total_unread_count : undefined;
    setCount(unreadCount);
    const listener = chatClient?.on((e) => {
      if (e.total_unread_count) {
        setCount(e.total_unread_count);
      }
    });

    return () => {
      if (listener) {
        listener.unsubscribe();
      }
    };
  }, [chatClient]);

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }]}>
      {!!count && (
        <Text style={styles.unreadText}>{count > 99 ? '99+' : count}</Text>
      )}
    </View>
  );
};
