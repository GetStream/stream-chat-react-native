import { ShimmeringView } from './components';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from './contexts';
import { useMemo } from 'react';

export const AITypingIndicatorView = ({ text }: { text: string }) => {
  const {
    theme: {
      colors: { shimmer },
    },
  } = useTheme();
  const styles = useStyles();

  return (
    <ShimmeringView shimmerColor={shimmer}>
      <Text style={styles.text}>{text}</Text>
    </ShimmeringView>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        text: {
          fontSize: 16,
          color: theme.colors.grey_dark,
        },
      }),
    [theme],
  );
};
