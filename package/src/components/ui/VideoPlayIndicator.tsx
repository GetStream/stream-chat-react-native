import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { NewPlayIcon } from '../../icons/NewPlayIcon';
import { palette } from '../../theme/primitives/palette';

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
  const styles = useStyles();

  return (
    <View style={[styles.container, sizes[size]]}>
      <NewPlayIcon fill={palette.white} height={iconSizes[size]} width={iconSizes[size]} />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { radius },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        alignItems: 'center',
        backgroundColor: palette.black,
        borderRadius: radius.full,
        justifyContent: 'center',
      },
    });
  }, [radius]);
};
