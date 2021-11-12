import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type CooldownTimerProps = {
  seconds: number;
};

/**
 * Renders an amount of seconds left for a cooldown to finish.
 *
 * See `useCountdown` for an example of how to set a countdown
 * to use as the source of `seconds`.
 **/
export const CooldownTimer = (props: CooldownTimerProps) => {
  const { seconds } = props;
  const {
    theme: {
      colors: { black },
      messageInput: { cooldownTimer },
    },
  } = useTheme();

  return (
    <Text style={[{ color: black }, cooldownTimer]} testID='cooldown-seconds'>
      {seconds}
    </Text>
  );
};
