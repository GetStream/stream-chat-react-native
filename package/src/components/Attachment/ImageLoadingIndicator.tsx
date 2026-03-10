import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';

export const ImageLoadingIndicator = () => {
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <NativeShimmerView
      accessibilityLabel='Image Loading Indicator'
      accessible
      enabled
      gradientColor={semantics.skeletonLoadingHighlight}
      style={StyleSheet.absoluteFillObject}
    >
      <View pointerEvents='none' style={styles.centered}>
        <ActivityIndicator />
      </View>
    </NativeShimmerView>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
