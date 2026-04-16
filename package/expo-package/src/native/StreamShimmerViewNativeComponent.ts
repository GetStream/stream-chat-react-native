import type { ColorValue, HostComponent, ViewProps } from 'react-native';

import type { Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export interface NativeProps extends ViewProps {
  baseColor?: ColorValue;
  duration?: WithDefault<Int32, 1200>;
  enabled?: WithDefault<boolean, true>;
  gradientColor?: ColorValue;
}

export default codegenNativeComponent<NativeProps>(
  'StreamShimmerView',
) as HostComponent<NativeProps>;
