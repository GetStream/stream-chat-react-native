import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native';

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

export const UnreadCountBadge: React.FC = () => {
  const {
    theme: {
      colors: { accent_red },
    },
  } = useTheme();

  const { chatClient } = useAppContext();
  const [count, setCount] = useState<number>();

  useEffect(() => {
    const listener = chatClient?.on((e) => {
      if (e.total_unread_count !== undefined) {
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
      {!!count && <Text style={styles.unreadText}>{count > 99 ? '99+' : count}</Text>}
    </View>
  );
};
