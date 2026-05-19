/* global require */

module.exports = {
  globalSetup: './jest-global-setup.js',
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
    // `@legendapp/list/react-native` ships a `react-native.web.js` fallback that imports `react-dom`.
    // Jest's CJS resolver does not always pass the `react-native` condition for nested subpaths,
    // so we explicitly redirect to the native build under test.
    '^@legendapp/list/react-native$': '<rootDir>/node_modules/@legendapp/list/react-native.js',
  },
  preset: 'react-native',
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    require.resolve('./jest-setup.tsx'),
  ],
  testEnvironment: 'node',
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
