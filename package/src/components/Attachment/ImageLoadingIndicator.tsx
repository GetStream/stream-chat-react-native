import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ShimmerView } from '../UIComponents/Shimmer/ShimmerView';

export const ImageLoadingIndicator = () => {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <ShimmerView>
        <ActivityIndicator />
      </ShimmerView>
    </View>
  );
};
