import React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { StreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewTitleProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> & {
  displayName: string;
};

export const ChannelPreviewTitle = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelPreviewTitleProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { displayName } = props;
  const {
    theme: {
      channelPreview: { title },
      colors: { black },
    },
  } = useTheme();

  return (
    <Text numberOfLines={1} style={[styles.title, { color: black }, title]}>
      {displayName}
    </Text>
  );
};
