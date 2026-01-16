import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type BadgeNotificationProps = {
  type: 'primary' | 'error' | 'neutral';
  count: number;
  size: 'sm' | 'md';
  testID?: string;
};

const sizes = {
  md: {
    fontSize: 12,
    lineHeight: 16,
    minWidth: 20,
    borderWidth: 2,
  },
  sm: {
    fontSize: 10,
    lineHeight: 14,
    minWidth: 16,
    borderWidth: 1,
  },
};

export const BadgeNotification = (props: BadgeNotificationProps) => {
  const { type, count, size = 'md', testID } = props;
  const styles = useStyles();
  const {
    theme: {
      colors: { accent },
    },
  } = useTheme();

  const colors = {
    error: accent.error,
    neutral: accent.neutral,
    primary: accent.primary,
  };

  return (
    <Text style={[styles.text, { backgroundColor: colors[type] }, sizes[size]]} testID={testID}>
      {count}
    </Text>
  );
};

const useStyles = () => {
  const {
    theme: {
      radius,
      colors: { badge },
      typography,
      spacing,
    },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: badge.text,
          fontWeight: typography.fontWeight.bold,
          includeFontPadding: false,
          textAlign: 'center',
          paddingHorizontal: spacing.xxs,
          borderColor: badge.border,
          borderRadius: radius.full,
        },
      }),
    [radius, badge, typography, spacing],
  );
};
