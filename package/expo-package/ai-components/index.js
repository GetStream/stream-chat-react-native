import { Platform } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core/ai-components';

import { NativeShimmerView } from '../src/optionalDependencies/NativeShimmerView';

// This entry point deliberately does not import `../src/index.js`: that file re-exports the whole
// core SDK, which Metro would then bundle into apps that only use the AI components. Instead, only
// the native pieces the AI components need are registered here. Registering them again when the
// main entry point is imported as well is harmless.

// `PerfText` is an Android-only Fabric component.
registerNativeHandlers({
  NativeShimmerView,
  PerfText:
    Platform.OS === 'android'
      ? require('../src/native/PerfTextNativeComponent').default
      : undefined,
});

export * from 'stream-chat-react-native-core/ai-components';
