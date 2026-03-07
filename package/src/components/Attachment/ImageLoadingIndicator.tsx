import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';
import { ShimmerView } from '../UIComponents/Shimmer/ShimmerView';

export const ImageLoadingIndicator = () => {
  const {
    theme: { semantics },
  } = useTheme();
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return (
      <NativeShimmerView
        enabled
        gradientColor={semantics.skeletonLoadingHighlight}
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
