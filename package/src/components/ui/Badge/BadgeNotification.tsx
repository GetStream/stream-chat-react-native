import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type BadgeNotificationProps = {
  type?: 'primary' | 'error' | 'neutral';
  count: number;
  size: 'sm' | 'xs';
  testID?: string;
};

const sizes = {
  sm: {
    height: 20,
    minWidth: 20,
  },
  xs: {
    height: 16,
    minWidth: 16,
  },
};

const textStyles = {
  sm: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
  },
  xs: {
    fontSize: primitives.typographyFontSizeXxs,
    fontWeight: primitives.typographyFontWeightBold,
  },
};

export const BadgeNotification = (props: BadgeNotificationProps) => {
  const { type = 'primary', count, size = 'sm', testID } = props;
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
    <View style={styles.border}>
      <View style={[styles.container, { backgroundColor: colors[type] }, sizes[size]]}>
        <Text style={[styles.text, textStyles[size]]} testID={testID}>
          {count}
        </Text>
      </View>
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
          borderRadius: primitives.radiusMax,
          justifyContent: 'center',
          alignItems: 'center',
        },
        border: {
          borderWidth: 2,
          borderColor: semantics.badgeBorder,
          borderRadius: primitives.radiusMax,
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
