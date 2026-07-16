import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts';
import { useComponentsContext } from '../../../contexts/componentsContext/ComponentsContext';
import { primitives } from '../../../theme';
import { buttonSizes } from '../../ui/Button/constants';

export type PlayPauseButtonProps = PressableProps & {
  /**
   * If true, the button will be playing.
   */
  isPlaying: boolean;
  /**
   * The function to be called when the button is pressed.
   */
  onPress: () => void;
  /**
   * The style of the container.
   */
  containerStyle?: StyleProp<ViewStyle>;
};

export const PlayPauseButton = ({
  isPlaying,
  onPress,
  containerStyle,
  ...rest
}: PlayPauseButtonProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  const { icons } = useComponentsContext();
  const styles = useStyles();
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
      {...rest}
    >
      {isPlaying ? (
        <icons.Pause fill={semantics.textSecondary} height={20} width={20} strokeWidth={1.5} />
      ) : (
        <icons.Play fill={semantics.textSecondary} height={20} width={20} strokeWidth={1.5} />
      )}
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
        ...buttonSizes.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: semantics.chatBorderOnChatIncoming,
      },
    });
  }, [semantics]);
};
