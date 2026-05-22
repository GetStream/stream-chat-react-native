import React, { useMemo } from 'react';

import { View, StyleSheet } from 'react-native';

import { useTheme } from '../../../contexts';
import { primitives } from '../../../theme';
import { ErrorBadge } from '../../ui/Badge/ErrorBadge';

export const MessageError = () => {
  const styles = useStyles();

  return (
    <View style={styles.wrapper}>
      <ErrorBadge size='sm' testID='message-error' />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { semantics },
  } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          borderRadius: primitives.radiusMax,
          borderWidth: 2,
          borderColor: semantics.badgeBorder,
        },
      }),
    [semantics],
  );
};
