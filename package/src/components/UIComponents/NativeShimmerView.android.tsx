import React from 'react';
import type { HostComponent, ViewProps, ColorValue } from 'react-native';

import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type NativeShimmerViewProps = ViewProps & {
  baseColor?: ColorValue;
  enabled?: boolean;
  gradientColor?: ColorValue;
  gradientHeight?: Double;
  gradientWidth?: Double;
  highlightColor?: ColorValue;
};

const NativeComponent = codegenNativeComponent<NativeShimmerViewProps>(
  'StreamShimmerView',
) as HostComponent<NativeShimmerViewProps>;

export const NativeShimmerView = (props: NativeShimmerViewProps) => {
  return <NativeComponent {...props} />;
};
