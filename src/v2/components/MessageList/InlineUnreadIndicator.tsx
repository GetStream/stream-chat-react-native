import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: '100%',
  },
  text: {
    color: '#7A7A7A',
    fontSize: 12,
  },
});

export const InlineUnreadIndicator: React.FC = () => {
  const {
    theme: {
      messageList: {
        inlineUnreadIndicator: { container, text },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container]}>
      <Text style={[styles.text, text]}>Unread Messages</Text>
    </View>
  );
};
