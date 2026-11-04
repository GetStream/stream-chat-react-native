import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from './contexts';
import { Shimmer } from './internal/Shimmer';
import { primitives } from './internal/tokens';

export const AITypingIndicatorView = ({ text }: { text: string }) => {
  const styles = useStyles();

  return (
    <Shimmer style={styles.wrapper}>
      <Text style={styles.text}>{text}</Text>
    </Shimmer>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          fontSize: primitives.typographyFontSizeMd,
          color: theme.colors.grey_dark,
        },
        wrapper: {
          alignSelf: 'flex-start',
          backgroundColor: 'transparent',
        },
      }),
    [theme],
  );
};
