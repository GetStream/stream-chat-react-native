import React from 'react';
import { ColorValue, View, ViewProps } from 'react-native';

import { NativeHandlers } from '../../native';

export type NativeShimmerViewProps = ViewProps & {
  baseColor?: ColorValue;
  duration?: number;
  enabled?: boolean;
  gradientColor?: ColorValue;
};

export const NativeShimmerView = (props: NativeShimmerViewProps) => {
  const NativeShimmerComponent = NativeHandlers.NativeShimmerView;
  if (NativeShimmerComponent) {
    return <NativeShimmerComponent {...props} />;
  }

  const { children, ...rest } = props;
  return <View {...rest}>{children}</View>;
};
