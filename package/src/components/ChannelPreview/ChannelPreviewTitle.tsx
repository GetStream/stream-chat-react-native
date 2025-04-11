import React from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '700' },
});

export type ChannelPreviewTitleProps = Pick<ChannelPreviewProps, 'channel'> & {
  /**
   * Formatted name for the previewed channel.
   */
  displayName: string;
};

export const ChannelPreviewTitle = (props: ChannelPreviewTitleProps) => {
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
