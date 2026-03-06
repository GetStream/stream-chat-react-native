import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';
import { RotateCircle } from '../../../icons/RotateCircle';
import { primitives } from '../../../theme';

const sizes = {
  lg: {
    height: 32,
    width: 32,
  },
  md: {
    height: 24,
    width: 24,
  },
};

const iconSizes = {
  lg: {
    height: 16,
    width: 16,
  },
  md: {
    height: 12,
    width: 12,
  },
};

export type RetryBadgeProps = ViewProps & {
  /**
   * The size of the badge
   * @default 'md'
   * @type {'lg' | 'md'}
   */
  size: 'lg' | 'md';
  /**
   * The style of the badge
   * @default undefined
   * @type {StyleProp<ViewStyle>}
   */
  style?: StyleProp<ViewStyle>;
};

export const RetryBadge = (props: RetryBadgeProps) => {
  const { size = 'md', style, ...rest } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.container, sizes[size], style]} {...rest}>
      <RotateCircle
        height={iconSizes[size].height}
        width={iconSizes[size].width}
        stroke={semantics.textOnAccent}
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
