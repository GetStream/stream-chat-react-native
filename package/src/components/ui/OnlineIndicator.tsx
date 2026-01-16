import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type OnlineIndicatorProps = {
  online: boolean;
  size: 'lg' | 'sm' | 'md';
};

const sizes = {
  lg: {
    borderWidth: 2,
    height: 14,
    width: 14,
  },
  md: {
    borderWidth: 2,
    height: 12,
    width: 12,
  },
  sm: {
    borderWidth: 1,
    height: 8,
    width: 8,
  },
};

export const OnlineIndicator = ({ online, size = 'md' }: OnlineIndicatorProps) => {
  const styles = useStyles();
  return <View style={[styles.indicator, sizes[size], online ? styles.online : styles.offline]} />;
};

const useStyles = () => {
  const {
    theme: {
      colors: { accent, presence },
      radius,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        indicator: {
          borderColor: presence.border,
          borderRadius: radius.full,
        },
        online: {
          backgroundColor: accent.success,
        },
        offline: {
          backgroundColor: accent.neutral,
        },
      }),
    [accent, presence, radius],
  );
};
