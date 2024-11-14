import React from 'react';

import { StyleSheet } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Mute } from '../../icons';

const styles = StyleSheet.create({
  iconStyle: {
    marginRight: 8,
  },
});

/**
 * This UI component displays an avatar for a particular channel.
 */
export const ChannelPreviewMutedStatus = () => {
  const {
    theme: {
      channelPreview: {
        mutedStatus: { height, iconStyle, width },
      },
      colors: { grey },
    },
  } = useTheme();

  return (
    <Mute height={height} pathFill={grey} style={[styles.iconStyle, iconStyle]} width={width} />
  );
};
