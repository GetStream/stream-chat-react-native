import { type ConfigPlugin, withInfoPlist } from '@expo/config-plugins';
import type { ConfigPluginProps } from './index';

const withiOSInfoPlist: ConfigPlugin<ConfigPluginProps> = (
  configuration,
  props = {},
) => {
  return withInfoPlist(configuration, (config) => {
    const infoPlist = config.modResults;

    const {
      dictationMicrophoneUsageDescription,
      dictationSpeechRecognitionUsageDescription,
    } = props;

    if (typeof dictationMicrophoneUsageDescription === 'string') {
      infoPlist.NSMicrophoneUsageDescription =
        dictationMicrophoneUsageDescription;
    }

    if (typeof dictationSpeechRecognitionUsageDescription === 'string') {
      infoPlist.NSSpeechRecognitionUsageDescription =
        dictationSpeechRecognitionUsageDescription;
    }

    return config;
  });
};

export default withiOSInfoPlist;
