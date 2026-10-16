const { withInfoPlist } = require('expo/config-plugins');

const DEFAULT_MICROPHONE_USAGE_DESCRIPTION =
  '$(PRODUCT_NAME) uses the microphone to transcribe your voice into messages.';
const DEFAULT_SPEECH_RECOGNITION_USAGE_DESCRIPTION =
  '$(PRODUCT_NAME) uses speech recognition to transcribe your voice into messages.';

/**
 * Adds the usage descriptions dictation needs. Explicit props win; otherwise descriptions the app
 * already defines are kept, and defaults are only added when there are none, since App Store Connect
 * rejects binaries that reference the Speech framework without one.
 */
const withiOSInfoPlist = (configuration, props = {}) =>
  withInfoPlist(configuration, (config) => {
    const infoPlist = config.modResults;

    const { dictationMicrophoneUsageDescription, dictationSpeechRecognitionUsageDescription } =
      props;

    if (typeof dictationMicrophoneUsageDescription === 'string') {
      infoPlist.NSMicrophoneUsageDescription = dictationMicrophoneUsageDescription;
    } else if (!infoPlist.NSMicrophoneUsageDescription) {
      infoPlist.NSMicrophoneUsageDescription = DEFAULT_MICROPHONE_USAGE_DESCRIPTION;
    }

    if (typeof dictationSpeechRecognitionUsageDescription === 'string') {
      infoPlist.NSSpeechRecognitionUsageDescription = dictationSpeechRecognitionUsageDescription;
    } else if (!infoPlist.NSSpeechRecognitionUsageDescription) {
      infoPlist.NSSpeechRecognitionUsageDescription = DEFAULT_SPEECH_RECOGNITION_USAGE_DESCRIPTION;
    }

    return config;
  });

module.exports = withiOSInfoPlist;
