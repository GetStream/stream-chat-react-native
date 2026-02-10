import React from 'react';
import { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { primitives } from '../../theme';

export const PROGRESS_THUMB_WIDTH = 12;
export const PROGRESS_THUMB_HEIGHT = 12;

export type ProgressControlThumbProps = {
  /**
   * If true, the underlying attachment is playing.
   */
  isPlaying: boolean;
  /**
   * The style of the progress control thumb.
   */
  style?: StyleProp<ViewStyle>;
};

export const ProgressControlThumb = ({ isPlaying, style }: ProgressControlThumbProps) => {
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <View
      hitSlop={20}
      style={[
        styles.progressControlThumbStyle,
        primitives.lightElevation4,
        {
          backgroundColor: isPlaying ? semantics.accentPrimary : semantics.accentNeutral,
        },
        style,
      ]}
    />
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      progressControlThumbStyle: {
        backgroundColor: semantics.accentPrimary,
        borderColor: semantics.borderCoreOnAccent,
        height: PROGRESS_THUMB_HEIGHT,
        width: PROGRESS_THUMB_WIDTH,
        borderRadius: primitives.radiusMax,
        borderWidth: 2,
      },
    });
  }, [semantics]);
};
