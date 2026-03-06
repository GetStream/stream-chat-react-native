import type { ColorValue, HostComponent, ViewProps } from 'react-native';

import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  baseColor?: ColorValue;
  enabled?: boolean;
  gradientColor?: ColorValue;
  gradientHeight?: Double;
  gradientWidth?: Double;
  highlightColor?: ColorValue;
}

export default codegenNativeComponent<NativeProps>(
  'StreamShimmerView',
) as HostComponent<NativeProps>;
