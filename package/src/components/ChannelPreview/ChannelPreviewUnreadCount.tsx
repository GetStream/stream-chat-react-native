import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { PrimitiveAtom, useAtom } from 'jotai';

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

export type ChannelPreviewUnreadCountProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelPreviewProps<StreamChatGenerics>, 'channel'> & {
  maxUnreadCount: number;
  unread: PrimitiveAtom<number>;
};

export const ChannelPreviewUnreadCount = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewUnreadCountProps<StreamChatGenerics>,
) => {
  const { maxUnreadCount, unread: unreadAtom } = props;
  const [unread] = unreadAtom ? useAtom(unreadAtom) : [0];

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
