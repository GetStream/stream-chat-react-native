import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from './contexts';

import { NativeShimmerView } from '../components/UIComponents/NativeShimmerView';

export const AITypingIndicatorView = ({ text }: { text: string }) => {
  const {
    theme: {
      colors: { shimmer },
    },
  } = useTheme();
  const styles = useStyles();

  // The native shimmer paints behind its children, so it is laid over the text instead: the
  // highlight has to sweep across the glyphs, which a transparent background would otherwise hide.
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{text}</Text>
      <NativeShimmerView
        baseColor={'transparent'}
        duration={1200}
        gradientColor={shimmer}
        pointerEvents='none'
        style={[StyleSheet.absoluteFill, styles.shimmer]}
      />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        // The native highlight band is soft and wide, so it is kept fairly strong over the text.
        shimmer: { opacity: 0.8 },
        text: {
          fontSize: 16,
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
