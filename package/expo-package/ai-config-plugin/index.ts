import {
  type ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from '@expo/config-plugins';
import withiOSInfoPlist from './withiOSInfoPlist';
import withAndroidManifestPermissions from './withAndroidManifest';

// path should be relative to dist
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json');

export type ConfigPluginProps = {
  dictationMicrophoneUsageDescription?: string;
  dictationSpeechRecognitionUsageDescription?: string;
};

const withStreamChatReactNativeAi: ConfigPlugin<ConfigPluginProps> = (
  config,
  props,
) => {
  return withPlugins(config, [
    // ios
    () => withiOSInfoPlist(config, props),
    // android
    () => withAndroidManifestPermissions(config, props),
  ]);
};

export default createRunOncePlugin(
  withStreamChatReactNativeAi,
  pkg.name,
  pkg.version,
);
