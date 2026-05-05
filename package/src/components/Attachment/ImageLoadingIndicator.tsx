import React from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '../../contexts';
import { NativeShimmerView } from '../UIComponents/NativeShimmerView';

export const ImageLoadingIndicator = React.memo(() => {
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <NativeShimmerView
      accessibilityLabel='Image Loading Indicator'
      accessible
      enabled
      gradientColor={semantics.skeletonLoadingHighlight}
      style={StyleSheet.absoluteFill}
    />
  );
});
