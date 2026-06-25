import type { HostComponent, ViewProps } from 'react-native';

import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

export type StreamMessageListScrollEvent = Readonly<{
  contentOffset: Readonly<{ x: Double; y: Double }>;
  contentSize: Readonly<{ width: Double; height: Double }>;
  layoutMeasurement: Readonly<{ width: Double; height: Double }>;
}>;

export interface NativeProps extends ViewProps {
  inverted?: WithDefault<boolean, false>;
  /** Total scrollable content height (dp), pushed from the JS height model — the native scroll range. */
  contentHeight?: Double;
  onStreamScroll?: DirectEventHandler<StreamMessageListScrollEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'StreamMessageListView',
) as HostComponent<NativeProps>;
