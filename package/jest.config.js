// eslint-disable-next-line no-undef
module.exports = {
  testEnvironment: 'jsdom',

  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
  },
  preset: 'react-native',
  setupFiles: [
    require.resolve('./jest-setup.js'),
    './src/mock-builders/native/react-native-mock.js',
    './node_modules/react-native-gesture-handler/jestSetup.js',
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '__snapshots__'],
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
  verbose: true,
};
