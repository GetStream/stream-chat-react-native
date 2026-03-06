import type { ColorValue, HostComponent, ViewProps } from 'react-native';

import type { Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  baseColor?: ColorValue;
  enabled?: WithDefault<boolean, true>;
  gradientColor?: ColorValue;
  gradientHeight?: Double;
  gradientWidth?: Double;
  highlightColor?: ColorValue;
}

export default codegenNativeComponent<NativeProps>(
  'StreamShimmerView',
) as HostComponent<NativeProps>;
