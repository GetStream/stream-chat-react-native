import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '../../../../contexts/themeContext/ThemeContext';
import { primitives } from '../../../../theme';
import { IconButton } from '../../../ui/IconButton';
import { useCooldownRemaining } from '../../hooks/useCooldownRemaining';

/**
 * Renders an amount of seconds left for a cooldown to finish.
 **/
export const CooldownTimer = () => {
  const seconds = useCooldownRemaining();
  const styles = useStyles();
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
  }, [seconds, text, styles]);

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

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: semantics.textDisabled,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
          lineHeight: primitives.typographyLineHeightNormal,
        },
      }),
    [semantics.textDisabled],
  );
};
