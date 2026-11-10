// E2E_COVERAGE=1 instruments the bundle for the e2e impact analysis (e2e/coverage/babelPlugin.js).
const coverage =
  process.env.E2E_COVERAGE === '1' ? [require.resolve('./e2e/coverage/babelPlugin')] : [];

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [...coverage, 'react-native-worklets/plugin'],
};
