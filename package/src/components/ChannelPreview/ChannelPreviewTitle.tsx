import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import type { ChannelPreviewProps } from './ChannelPreview';

import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type ChannelPreviewTitleProps = Pick<ChannelPreviewProps, 'channel'> & {
  /**
   * Formatted name for the previewed channel.
   */
  title?: string;
};

export const ChannelPreviewTitle = ({ channel, title }: ChannelPreviewTitleProps) => {
  const styles = useStyles();

  const displayName = useChannelPreviewDisplayName(channel);

  return (
    <Text numberOfLines={1} style={styles.title}>
      {title ?? displayName}
    </Text>
  );
};

const useStyles = () => {
  const {
    theme: {
      channelPreview: { title },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      title: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeMd,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightNormal,
        flexShrink: 1,
        ...title,
      },
    });
  }, [semantics, title]);
};
