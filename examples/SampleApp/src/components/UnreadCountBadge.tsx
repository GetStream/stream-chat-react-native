import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'stream-chat-react-native/v2';
import { AppContext } from '../context/AppContext';

export const UnreadCountBadge = () => {
  const {
    theme: {
      colors: { accent_red },
    },
  } = useTheme();

  const { chatClient } = useContext(AppContext);
  const [count, setCount] = useState<number | undefined>();

  useEffect(() => {
    // TODO: Fix the types on js client leve for client.user.
    // @ts-ignore
    setCount(chatClient?.user.total_unread_count);
    const listener = chatClient?.on((e) => {
      if (e.total_unread_count) {
        // @ts-ignore
        setCount(e.total_unread_count);
      }
    });

    return () => {
      listener?.unsubscribe();
    };
  }, [chatClient]);

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }]}>
      {!!count && (
        <Text style={[styles.unreadText]}>{count > 99 ? '99+' : count}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  unreadContainer: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
  },
  unreadText: {
    color: '#FFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
});
