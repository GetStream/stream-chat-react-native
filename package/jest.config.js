/* global require */
// eslint-disable-next-line no-undef
module.exports = {
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
  },
  preset: 'react-native',
  setupFiles: [
    './src/mock-builders/native/react-native-mock.js',
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', require.resolve('./jest-setup.js'),
  ],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '__snapshots__', '/lib/'],
  testRegex: [
    /**
     * If you want to test single file, mention it here
     * e.g.,
     * "src/components/ChannelList/__tests__/ChannelList.test.js",
     * "src/components/MessageList/__tests__/MessageList.test.js"
     */
  ],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/!(react-native-reanimated)'],
  verbose: true,
};
