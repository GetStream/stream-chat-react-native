import type * as React from 'react';
import type { HostComponent, ViewProps } from 'react-native';

import type {
  DirectEventHandler,
  Double,
  WithDefault,
} from 'react-native/Libraries/Types/CodegenTypes';
import codegenNativeCommands from 'react-native/Libraries/Utilities/codegenNativeCommands';
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

interface NativeCommands {
  /** Scroll to a content offset (dp). All imperative scrolls ride on this one command: JS owns the
   *  height model, so scrollToEnd / scrollToIndex just compute the target offset and dispatch this. */
  scrollToOffset: (
    viewRef: React.ElementRef<HostComponent<NativeProps>>,
    offset: Double,
    animated: boolean,
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollToOffset'],
});

export default codegenNativeComponent<NativeProps>(
  'StreamMessageListView',
) as HostComponent<NativeProps>;
