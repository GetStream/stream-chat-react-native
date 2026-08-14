/* global require */

module.exports = {
  globalSetup: './jest-global-setup.js',
  // cap worker count on CI
  ...(process.env.CI ? { maxWorkers: 2 } : {}),
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
  },
  preset: '@react-native/jest-preset',
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
  transformIgnorePatterns: [
    'node_modules/!(react-native-reanimated)',
    // LOCAL PORTAL ONLY (revert with the stream-chat portal): the portaled
    // stream-chat-js checkout lives outside node_modules, so babel-jest would
    // otherwise transform everything under it (its prebuilt CJS dist AND its own
    // node_modules) and inject @babel/runtime helper requires that can't resolve
    // from the checkout. It's all prebuilt CJS, so skip transforming any of it.
    'stream-chat-js-temp/',
  ],
  verbose: true,
};
