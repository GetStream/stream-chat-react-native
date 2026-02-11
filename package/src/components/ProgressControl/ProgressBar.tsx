import React, { useMemo, useState } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts';
import { primitives } from '../../theme';

const TRACK_HEIGHT = 8;

export type ProgressBarProps = {
  progress: number;
  filledColor: ColorValue;
  emptyColor: ColorValue;
};
export const ProgressBar = (props: ProgressBarProps) => {
  const [width, setWidth] = useState<number>(0);
  const { progress, filledColor, emptyColor } = props;
  const styles = useStyles();
  return (
    <View
      style={[styles.container, { backgroundColor: emptyColor }]}
      onLayout={({ nativeEvent }) => {
        setWidth(nativeEvent.layout.width);
      }}
    >
      <View
        style={[styles.filledStyle, { backgroundColor: filledColor, width: progress * width }]}
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
