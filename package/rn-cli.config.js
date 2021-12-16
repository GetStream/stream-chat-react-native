/* global module */
/* global require */
module.exports = {
  getSourceExts() {
    return ['ts', 'tsx'];
  },
  getTransformModulePath() {
    return require.resolve('react-native-typescript-transformer');
  },
};
