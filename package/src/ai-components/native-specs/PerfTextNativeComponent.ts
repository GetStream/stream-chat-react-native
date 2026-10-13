import type { ViewProps } from 'react-native';
import type { Float, Int32 } from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type ColorRange = {
  start: Int32;
  end: Int32;
  color: Int32; // processed to Android int on JS side
};

export interface NativeProps extends ViewProps {
  text: string;
  colorRanges?: ReadonlyArray<ColorRange>;
  fontSize?: Float;
  fontFamily?: string;
  lineHeight?: Float;
}

// Applying interfaceOnly is extremely important, as we are going to
// override some of the codegen-generated code within our C++ bindings
// and without it it won't compile as there will be naming collisions.
// This essentially allows the compiler to pick the interface that's
// defined first (which we make sure is ours within CMakeLists.txt) and
// stick with that, ignoring anything else.
export default codegenNativeComponent<NativeProps>('PerfText', {
  interfaceOnly: true,
});
