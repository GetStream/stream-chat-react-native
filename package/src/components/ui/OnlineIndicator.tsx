import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { foundations } from '../../theme';

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
    theme: { semantics },
  } = useTheme();

  const { presenceBorder, presenceBgOffline, presenceBgOnline } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        indicator: {
          borderColor: presenceBorder,
          borderRadius: foundations.radius.radiusFull,
        },
        online: {
          backgroundColor: presenceBgOnline,
        },
        offline: {
          backgroundColor: presenceBgOffline,
        },
      }),
    [presenceBgOnline, presenceBgOffline, presenceBorder],
  );
};
