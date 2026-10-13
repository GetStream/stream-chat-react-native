module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'babel-plugin-react-compiler',
    // Needed by `stream-chat-react-native/ai-components`: its `zod` dependency ships `export * as`.
    '@babel/plugin-transform-export-namespace-from',
    // react-native-worklets/plugin has to be the last one
    'react-native-worklets/plugin',
  ],
};
