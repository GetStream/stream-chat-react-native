import React from 'react';
import { useTheme } from '../../contexts';
import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  unreadContainer: {
    alignItems: 'center',
    borderRadius: 8,
    flexShrink: 1,
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

export type ChannelPreviewUnreadCountProps = {
  maxUnreadCount: number;
  unread?: number;
};
export const ChannelPreviewUnreadCount: React.FC<ChannelPreviewUnreadCountProps> = ({
  maxUnreadCount,
  unread,
}) => {
  const {
    theme: {
      channelPreview: { unreadContainer, unreadText },
      colors: { accent_red },
    },
  } = useTheme();

  return (
    <View
      style={[
        styles.unreadContainer,
        { backgroundColor: accent_red },
        unreadContainer,
      ]}
    >
      {!!unread && (
        <Text numberOfLines={1} style={[styles.unreadText, unreadText]}>
          {unread > maxUnreadCount ? `${maxUnreadCount}+` : unread}
        </Text>
      )}
    </View>
  );
};
