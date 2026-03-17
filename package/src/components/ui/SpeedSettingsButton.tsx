import React, { useMemo } from 'react';

import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { useTheme } from '../../contexts';
import { primitives } from '../../theme';

export type SpeedSettingsButtonProps = {
  /**
   * The current playback rate.
   */
  currentPlaybackRate: number;
  /**
   * The function to be called when the button is pressed.
   */
  onPress: () => void;
  /**
   * The style of the container.
   */
  containerStyle?: StyleProp<ViewStyle>;
};

export const SpeedSettingsButton = ({
  currentPlaybackRate,
  onPress,
  containerStyle,
}: SpeedSettingsButtonProps) => {
  const styles = useStyles();
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? semantics.backgroundUtilityPressed : 'transparent',
        },
        containerStyle,
      ]}
    >
      <Text style={styles.text}>{`x${currentPlaybackRate.toFixed(1)}`}</Text>
    </Pressable>
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
        height: 24,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: semantics.controlPlaybackToggleBorder,
      },
      text: {
        color: semantics.controlPlaybackToggleText,
        fontSize: primitives.typographyFontSizeXs,
        fontWeight: primitives.typographyFontWeightSemiBold,
        lineHeight: primitives.typographyLineHeightTight,
      },
    });
  }, [semantics]);
};
