import React from 'react';
import { ColorValue, View, ViewProps } from 'react-native';

import { NativeHandlers } from '../../native';

export type NativeShimmerViewProps = ViewProps & {
  baseColor?: ColorValue;
  enabled?: boolean;
  gradientColor?: ColorValue;
  gradientHeight?: number;
  gradientWidth?: number;
  highlightColor?: ColorValue;
};

export const NativeShimmerView = (props: NativeShimmerViewProps) => {
  const NativeShimmerComponent = NativeHandlers.NativeShimmerView;
  if (NativeShimmerComponent) {
    return <NativeShimmerComponent {...props} enabled={true} />;
  }

  const { children, ...rest } = props;
  return <View {...rest}>{children}</View>;
};
