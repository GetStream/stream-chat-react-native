import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';
import { onlineIndicatorSizes } from '../Avatar/constants';

export type OnlineIndicatorProps = {
  online: boolean;
  size: 'xl' | 'lg' | 'sm' | 'md';
};

export const OnlineIndicator = ({ online, size = 'md' }: OnlineIndicatorProps) => {
  const styles = useStyles();
  return (
    <View
      style={[
        styles.indicator,
        onlineIndicatorSizes[size],
        online ? styles.online : styles.offline,
      ]}
    />
  );
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
          borderRadius: primitives.radiusMax,
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
