import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { Exclamation } from '../../../icons/Exclamation';
import { primitives } from '../../../theme';

const sizes = {
  xs: {
    height: 16,
    width: 16,
  },
  sm: {
    height: 20,
    width: 20,
  },
  md: {
    height: 24,
    width: 24,
  },
};

const iconSizes = {
  xs: {
    height: 8,
    width: 2,
  },
  sm: {
    height: 9,
    width: 2,
  },
  md: {
    height: 11,
    width: 3,
  },
};

export type ErrorBadgeProps = ViewProps & {
  /**
   * The size of the badge
   * @default 'md'
   * @type {'xs' | 'sm' | 'md'}
   */
  size: 'xs' | 'sm' | 'md';
  /**
   * The style of the badge
   * @default undefined
   * @type {StyleProp<ViewStyle>}
   */
  style?: StyleProp<ViewStyle>;
};

export const ErrorBadge = (props: ErrorBadgeProps) => {
  const { size = 'md', style, ...rest } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.container, sizes[size], style]} {...rest}>
      <Exclamation
        height={iconSizes[size].height}
        width={iconSizes[size].width}
        fill={semantics.textOnAccent}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: primitives.radiusMax,
        backgroundColor: semantics.badgeBgError,
      },
    });
  }, [semantics]);
};
