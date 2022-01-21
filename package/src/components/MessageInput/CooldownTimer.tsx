import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';

export type CooldownTimerProps = {
  seconds: number;
};

const CONTAINER_SIZE = 24;
const CONTAINER_HORIZONTAL_PADDING = 6;
const EXTRA_CHARACTER_PADDING = CONTAINER_SIZE - CONTAINER_HORIZONTAL_PADDING * 2;

/**
 * To avoid the container jumping between sizes when there are more
 * than one character in the width of the container since we aren't
 * using a monospaced font.
 */
const normalizeWidth = (seconds: number) =>
  CONTAINER_SIZE + EXTRA_CHARACTER_PADDING * (`${seconds}`.length - 1);

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
      colors: { black, grey_gainsboro },
      messageInput: {
        cooldownTimer: { container, text },
      },
    },
  } = useTheme('CooldownTimer');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: grey_gainsboro,
          width: normalizeWidth(seconds),
        },
        container,
      ]}
    >
      <Text style={[styles.text, { color: black }, text]} testID='cooldown-seconds'>
        {seconds}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: CONTAINER_SIZE / 2,
    height: CONTAINER_SIZE,
    justifyContent: 'center',
    minWidth: CONTAINER_SIZE,
    paddingHorizontal: CONTAINER_HORIZONTAL_PADDING,
  },
  text: { fontSize: 16, fontWeight: '600' },
});
