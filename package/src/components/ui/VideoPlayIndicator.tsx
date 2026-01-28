import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts';
import { NewPlayIcon } from '../../icons/NewPlayIcon';
import { primitives } from '../../theme';

const sizes = {
  lg: {
    height: 48,
    width: 48,
  },
  md: {
    height: 40,
    width: 40,
  },
  sm: {
    height: 20,
    width: 20,
  },
};

const iconSizes = {
  lg: 20,
  md: 16,
  sm: 10,
};

export type VideoPlayIndicatorProps = {
  size: 'sm' | 'md' | 'lg';
};

export const VideoPlayIndicator = (props: VideoPlayIndicatorProps) => {
  const { size = 'md' } = props;
  const {
    theme: { semantics },
  } = useTheme();
  const styles = useStyles();

  return (
    <View style={[styles.container, sizes[size]]}>
      <NewPlayIcon
        fill={semantics.controlPlayControlIconInverse}
        height={iconSizes[size]}
        width={iconSizes[size]}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  const { controlPlayControlBgInverse } = semantics;

  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        backgroundColor: controlPlayControlBgInverse,
        borderRadius: primitives.radiusMax,
        justifyContent: 'center',
      },
    });
  }, [controlPlayControlBgInverse]);
};
