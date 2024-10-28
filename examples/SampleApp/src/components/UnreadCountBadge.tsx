import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useStateStore, useTheme } from 'stream-chat-react-native';

import { useAppContext } from '../context/AppContext';
import { ThreadManagerState } from 'stream-chat';

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

const selector = (nextValue: ThreadManagerState) => [nextValue.unreadThreadCount];

export const ThreadsUnreadCountBadge: React.FC = () => {
  const { chatClient } = useAppContext();
  const [unreadCount] = useStateStore(chatClient?.threads?.state, selector);

  return <UnreadCountBadge unreadCount={unreadCount} />;
};

export const ChannelsUnreadCountBadge: React.FC = () => {
  const { unreadCount } = useAppContext();

  return <UnreadCountBadge unreadCount={unreadCount} />;
};

type UnreadCountBadgeProps = {
  unreadCount: number | undefined;
};

const UnreadCountBadge: React.FC<UnreadCountBadgeProps> = (props) => {
  const { unreadCount } = props;
  const {
    theme: {
      colors: { accent_red },
    },
  } = useTheme();

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }]}>
      {!!unreadCount && (
        <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
      )}
    </View>
  );
};
