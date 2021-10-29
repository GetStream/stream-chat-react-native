import React from 'react';
import { Text } from 'react-native';

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

  return <Text testID='cooldown-seconds'>{seconds}</Text>;
};
