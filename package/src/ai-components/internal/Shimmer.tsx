import React, { type PropsWithChildren } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { NativeShimmerView } from '../../components/UIComponents/NativeShimmerView';
import { useTheme } from '../contexts';

type ShimmerProps = PropsWithChildren<{ active?: boolean; style?: StyleProp<ViewStyle> }>;

/**
 * Sweeps the native shimmer across its content while `active`, for something still in progress.
 * The native shimmer paints behind its children, so it is laid over the content instead, with a
 * transparent base: the highlight has to cross the glyphs, which would otherwise hide it.
 */
export const Shimmer = ({ active = true, children, style }: ShimmerProps) => {
  const {
    theme: {
      colors: { shimmer },
    },
  } = useTheme();

  return (
    <View style={style}>
      {children}
      {active ? (
        <NativeShimmerView
          baseColor='transparent'
          duration={1200}
          gradientColor={shimmer}
          pointerEvents='none'
          style={[StyleSheet.absoluteFill, styles.shimmer]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // The native highlight band is soft and wide, so it is kept fairly strong over the text.
  shimmer: { opacity: 0.8 },
});
