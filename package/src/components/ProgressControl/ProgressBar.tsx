import React, { useMemo } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts';
import { primitives } from '../../theme';

const TRACK_HEIGHT = 8;

export type ProgressBarProps = {
  progress: number;
  filledColor: ColorValue;
  emptyColor: ColorValue;
};

export const ProgressBar = ({ progress, filledColor, emptyColor }: ProgressBarProps) => {
  const styles = useStyles();

  // clamp for safety
  const value = Math.max(0, Math.min(progress, 1));
  const unfilledValue = 1 - value;

  return (
    <View style={[styles.container, { backgroundColor: emptyColor }]}>
      <View
        style={[
          styles.filledStyle,
          {
            backgroundColor: filledColor,
            flex: value,
          },
        ]}
      />
      <View style={{ flex: unfilledValue }} />
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
        borderRadius: primitives.radiusMax,
        height: TRACK_HEIGHT,
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: semantics.chatWaveformBar,
      },
      filledStyle: {
        backgroundColor: semantics.chatWaveformBarPlaying,
        height: TRACK_HEIGHT,
        borderRadius: primitives.radiusMax,
      },
    });
  }, [semantics]);
};
