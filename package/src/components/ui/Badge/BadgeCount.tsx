import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../theme';

export type BadgeCountProps = {
  count: string | number;
  size: 'sm' | 'md' | 'lg';
};

const sizes = {
  lg: {
    minWidth: 32,
    height: 32,
  },
  md: {
    minWidth: 24,
    height: 24,
  },
  sm: {
    minWidth: 20,
    height: 20,
  },
};

const textStyles = {
  sm: {
    fontSize: primitives.typographyFontSizeXxs,
    fontWeight: primitives.typographyFontWeightBold,
  },
  md: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
  },
  lg: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
  },
};

const paddingHorizontal: Record<BadgeCountProps['size'], number> = {
  sm: primitives.spacingXxs,
  md: primitives.spacingXs,
  lg: primitives.spacingXs,
};

export const BadgeCount = (props: BadgeCountProps) => {
  const { count, size = 'sm' } = props;
  const styles = useStyles();

  return (
    <View
      style={[
        styles.container,
        sizes[size],
        primitives.lightElevation2,
        { paddingHorizontal: paddingHorizontal[size] },
      ]}
    >
      <Text style={[styles.text, textStyles[size]]}>{count}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { badgeBgDefault, badgeText, borderCoreSubtle } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: badgeBgDefault,
          borderColor: borderCoreSubtle,
          borderWidth: 1,
          borderRadius: primitives.radiusMax,
          justifyContent: 'center',
        },
        text: {
          color: badgeText,
          includeFontPadding: false,
          textAlign: 'center',
        },
      }),
    [badgeBgDefault, badgeText, borderCoreSubtle],
  );
};
