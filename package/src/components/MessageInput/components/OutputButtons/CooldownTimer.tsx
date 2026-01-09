import React, { useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { IconButton } from '../../../ui/IconButton';

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
      messageInput: {
        cooldownTimer: { text },
      },
    },
  } = useTheme();

  const icon = useCallback(() => {
    return (
      <Text style={[styles.text, text]} testID='cooldown-seconds'>
        {seconds}
      </Text>
    );
  }, [seconds, text]);

  return (
    <IconButton
      disabled={true}
      Icon={icon}
      iconColor='white'
      size='sm'
      status='disabled'
      testID='cooldown-timer'
    />
  );
};

const styles = StyleSheet.create({
  text: { color: '#B8BEC4', fontSize: 16, fontWeight: '600' },
});
