const { createRunOncePlugin, withPlugins } = require('expo/config-plugins');

const pkg = require('../package.json');

const withAndroidManifestPermissions = require('./withAndroidManifest');
const withiOSInfoPlist = require('./withiOSInfoPlist');
const withPodfileProperties = require('./withPodfileProperties');

/**
 * Config plugin of `stream-chat-expo`. It sets up the speech-to-text dictation used by
 * `stream-chat-expo/ai-components`:
 *
 * - iOS: compiles the dictation module in (it is left out by default, see the podspec) and adds the
 *   microphone and speech recognition usage descriptions.
 * - Android: adds the `RECORD_AUDIO` permission.
 *
 * Props:
 * - `enableDictation` (default `true`): set to `false` to leave dictation out.
 * - `dictationMicrophoneUsageDescription`, `dictationSpeechRecognitionUsageDescription`: the iOS
 *   usage descriptions; defaults are used when the app does not define its own.
 *
 * @type {import('expo/config-plugins').ConfigPlugin<{
 *   enableDictation?: boolean;
 *   dictationMicrophoneUsageDescription?: string;
 *   dictationSpeechRecognitionUsageDescription?: string;
 * } | void>}
 */
const withStreamChatExpo = (config, props = {}) => {
  const options = props ?? {};
  if (options.enableDictation === false) {
    return withPodfileProperties(config, options);
  }

  return withPlugins(config, [
    // ios
    [withiOSInfoPlist, options],
    [withPodfileProperties, options],
    // android
    [withAndroidManifestPermissions, options],
  ]);
};

module.exports = createRunOncePlugin(withStreamChatExpo, pkg.name, pkg.version);
