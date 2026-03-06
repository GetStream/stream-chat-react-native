import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';
import { ShimmerView } from '../UIComponents/Shimmer/ShimmerView';

export const ImageLoadingIndicator = () => {
  const {
    theme: {
      semantics,
      shimmer: { width, height },
    },
  } = useTheme();

  if (Platform.OS === 'android') {
    return (
      <NativeShimmerView
        baseColor={semantics.backgroundCoreApp}
        enabled
        gradientColor='white'
        gradientHeight={height}
        gradientWidth={width}
        highlightColor='rgba(255,255,255,0.35)'
        style={StyleSheet.absoluteFillObject}
      >
        <View pointerEvents='none' style={styles.centered}>
          <ActivityIndicator />
        </View>
      </NativeShimmerView>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <ShimmerView>
        <ActivityIndicator />
      </ShimmerView>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
