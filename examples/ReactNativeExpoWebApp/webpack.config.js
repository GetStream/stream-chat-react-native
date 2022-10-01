const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: [
        'stream-chat-expo',
        'stream-chat-react-native-core',
        '@gorhom',
        'react-native-markdown-package',
      ],
    },
    argv,
  });
  // Customize the config before returning it.
  return config;
};
