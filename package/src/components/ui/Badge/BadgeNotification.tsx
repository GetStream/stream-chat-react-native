import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type BadgeNotificationProps = {
  type: 'primary' | 'error' | 'neutral';
  count: number;
  size: 'sm' | 'md' | 'lg';
  testID?: string;
};

const sizes = {
  lg: {
    height: 24,
    minWidth: 24,
    borderWidth: 2,
  },
  md: {
    height: 20,
    minWidth: 20,
    borderWidth: 2,
  },
  sm: {
    height: 16,
    minWidth: 16,
    borderWidth: 1,
  },
};

const textStyles = {
  lg: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 14,
  },
  md: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 14,
  },
  sm: {
    fontSize: primitives.typographyFontSizeXxs,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 10,
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
    <View style={[styles.container, { backgroundColor: colors[type] }, sizes[size]]}>
      <Text style={[styles.text, textStyles[size]]} testID={testID}>
        {count}
      </Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: primitives.spacingXxs,
          borderColor: semantics.badgeBorder,
          borderRadius: primitives.radiusMax,
          justifyContent: 'center',
        },
        text: {
          color: semantics.badgeTextOnAccent,
          includeFontPadding: false,
          textAlign: 'center',
        },
      }),
    [semantics],
  );
};
