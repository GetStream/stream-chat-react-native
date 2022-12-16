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

  const { unreadCount } = useAppContext();

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }]}>
      {!!unreadCount && (
        <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
      )}
    </View>
  );
};
