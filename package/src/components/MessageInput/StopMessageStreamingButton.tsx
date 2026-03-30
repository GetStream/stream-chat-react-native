import React, { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { Stop } from '../../icons';
import { primitives } from '../../theme';

export type StopMessageStreamingButtonProps = {
  /** Function that opens attachment options bottom sheet */
  onPress?: () => void;
};

export const StopMessageStreamingButton = (props: StopMessageStreamingButtonProps) => {
  const { onPress } = props;

  const {
    theme: {
      semantics,
      messageComposer: { stopMessageStreamingButton, stopMessageStreamingIcon },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <Pressable
      hitSlop={{ bottom: 15, left: 15, right: 15, top: 15 }}
      onPress={onPress}
      style={[styles.stopStreamingButton, stopMessageStreamingButton]}
      testID='more-options-button'
    >
      <Stop fill={semantics.accentPrimary} size={24} {...stopMessageStreamingIcon} />
    </Pressable>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        stopStreamingButton: {
          borderWidth: 1,
          borderRadius: primitives.radiusMax,
          borderColor: semantics.accentPrimary,
        },
      }),
    [semantics],
  );
};

StopMessageStreamingButton.displayName = 'StopMessageStreamingButton{messageComposer}';
