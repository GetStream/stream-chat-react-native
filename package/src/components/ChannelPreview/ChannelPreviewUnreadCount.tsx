import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChannelPreviewProps } from './ChannelPreview';

import type { ChannelsContextValue } from '../../contexts/channelsContext/ChannelsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type ChannelPreviewUnreadCountProps = Pick<ChannelsContextValue, 'maxUnreadCount'> &
  Pick<ChannelPreviewProps, 'channel'> & {
    /**
     * Number of unread messages on the channel
     */
    unread?: number;
  };

export const ChannelPreviewUnreadCount = (props: ChannelPreviewUnreadCountProps) => {
  const { maxUnreadCount, unread } = props;
  const {
    theme: {
      channelPreview: { unreadContainer, unreadText },
      colors: { accent_red },
    },
  } = useTheme();

  if (!unread) {
    return null;
  }

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }, unreadContainer]}>
      <Text numberOfLines={1} style={[styles.unreadText, unreadText]}>
        {unread > maxUnreadCount ? `${maxUnreadCount}+` : unread}
      </Text>
    </View>
  );
};

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
