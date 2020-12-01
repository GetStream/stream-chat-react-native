import React from 'react';
import { Text, View } from 'react-native';

export const InlineUnreadIndicator = () => (
  <View
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      width: '100%',
    }}
  >
    <Text style={{ color: '#7D7D7D' }}>Unread Messages</Text>
  </View>
);
