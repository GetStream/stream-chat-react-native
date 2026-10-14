const { withPodfileProperties } = require('expo/config-plugins');

/**
 * Tells the stream-chat-expo podspec whether to compile the dictation module in, through the
 * `stream-chat.enableDictation` key of ios/Podfile.properties.json.
 */
const withStreamPodfileProperties = (configuration, props = {}) =>
  withPodfileProperties(configuration, (config) => {
    config.modResults['stream-chat.enableDictation'] = String(props.enableDictation !== false);
    return config;
  });

module.exports = withStreamPodfileProperties;
