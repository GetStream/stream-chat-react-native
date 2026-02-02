import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export type BadgeCountProps = {
  count: string | number;
  size: 'sm' | 'xs' | 'md';
};

const sizes = {
  md: {
    minWidth: 32,
    height: 32,
  },
  sm: {
    minWidth: 24,
    height: 24,
  },
  xs: {
    minWidth: 20,
    height: 20,
  },
};

const textStyles = {
  md: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 14,
  },
  sm: {
    fontSize: primitives.typographyFontSizeSm,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 14,
  },
  xs: {
    fontSize: primitives.typographyFontSizeXxs,
    fontWeight: primitives.typographyFontWeightBold,
    lineHeight: 10,
  },
};

export const BadgeCount = (props: BadgeCountProps) => {
  const { count, size = 'sm' } = props;
  const styles = useStyles();
  const paddingHorizontal = size === 'xs' ? primitives.spacingXxs : primitives.spacingXs;

  return (
    <View
      style={[styles.container, sizes[size], primitives.lightElevation2, { paddingHorizontal }]}
    >
      <Text style={[styles.text, textStyles[size]]}>{count}</Text>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { badgeBgDefault, badgeTextInverse, borderCoreSubtle } = semantics;

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
          color: badgeTextInverse,
          includeFontPadding: false,
          textAlign: 'center',
        },
      }),
    [badgeBgDefault, badgeTextInverse, borderCoreSubtle],
  );
};
