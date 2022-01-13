import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { StreamChatGenerics } from '../../types/types';

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

export type ChannelPreviewUnreadCountProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> & {
  maxUnreadCount: number;
  unread?: number;
};

export const ChannelPreviewUnreadCount = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelPreviewUnreadCountProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { maxUnreadCount, unread } = props;
  const {
    theme: {
      channelPreview: { unreadContainer, unreadText },
      colors: { accent_red },
    },
  } = useTheme();

  return (
    <View style={[styles.unreadContainer, { backgroundColor: accent_red }, unreadContainer]}>
      {!!unread && (
        <Text numberOfLines={1} style={[styles.unreadText, unreadText]}>
          {unread > maxUnreadCount ? `${maxUnreadCount}+` : unread}
        </Text>
      )}
    </View>
  );
};
