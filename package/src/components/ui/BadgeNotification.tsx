import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { foundations, primitives } from '../../theme';

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
    theme: { semantics },
  } = useTheme();

  const colors = {
    error: semantics.badgeBgError,
    neutral: semantics.badgeBgNeutral,
    primary: semantics.badgeBgPrimary,
  };

  return (
    <Text style={[styles.text, { backgroundColor: colors[type] }, sizes[size]]} testID={testID}>
      {count}
    </Text>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { badgeText, badgeBorder } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: badgeText,
          fontWeight: primitives.typographyFontWeightBold,
          includeFontPadding: false,
          textAlign: 'center',
          paddingHorizontal: primitives.spacingXxs,
          borderColor: badgeBorder,
          borderRadius: foundations.radius.radiusFull,
        },
      }),
    [badgeText, badgeBorder],
  );
};
