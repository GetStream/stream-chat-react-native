import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type BadgeCountProps = {
  count: number;
  size: 'sm' | 'xs';
};

const sizes = {
  sm: {
    borderRadius: 12,
    minWidth: 24,
    lineHeight: 22,
  },
  xs: {
    borderRadius: 10,
    minWidth: 20,
    lineHeight: 18,
  },
};

export const BadgeCount = (props: BadgeCountProps) => {
  const { count, size = 'sm' } = props;
  const styles = useStyles();

  return <Text style={[styles.text, sizes[size]]}>{count}</Text>;
};

const useStyles = () => {
  const {
    theme: {
      colors: { border, badge },
      typography,
    },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          backgroundColor: badge.bgInverse,
          borderColor: border.surfaceSubtle,
          borderWidth: 1,
          color: badge.textInverse,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.bold,
          includeFontPadding: false,
          textAlign: 'center',
        },
      }),
    [border, badge, typography],
  );
};
