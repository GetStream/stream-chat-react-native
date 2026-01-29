import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

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
    theme: { semantics },
  } = useTheme();

  const { badgeBgInverse, badgeTextInverse, borderCoreSubtle } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          backgroundColor: badgeBgInverse,
          borderColor: borderCoreSubtle,
          borderWidth: 1,
          color: badgeTextInverse,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightBold,
          includeFontPadding: false,
          textAlign: 'center',
        },
      }),
    [badgeBgInverse, badgeTextInverse, borderCoreSubtle],
  );
};
