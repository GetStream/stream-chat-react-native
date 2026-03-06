import React from 'react';
import { ColorValue, View, ViewProps } from 'react-native';

export type NativeShimmerViewProps = ViewProps & {
  baseColor?: ColorValue;
  enabled?: boolean;
  gradientColor?: ColorValue;
  gradientHeight?: number;
  gradientWidth?: number;
  highlightColor?: ColorValue;
};

export const NativeShimmerView = (props: NativeShimmerViewProps) => {
  const { children, ...rest } = props;
  return <View {...rest}>{children}</View>;
};
