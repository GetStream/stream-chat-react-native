/* global require */

module.exports = {
  globalSetup: './jest-global-setup.js',
  // cap worker count on CI
  ...(process.env.CI ? { maxWorkers: 2 } : {}),
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
    // See __mocks__/SvgTouchableMixin.js - react-native-svg reads `Touchable.Mixin` off the
    // react-native root, and RN 0.87's late, non-enumerable re-export of it is lost through
    // Babel's ESM interop under Jest. Mapped (rather than jest.mock'd) so it also applies in the
    // separate registry Jest uses to build automocks.
    SvgTouchableMixin$: '<rootDir>/__mocks__/SvgTouchableMixin.js',
    // See __mocks__/reanimatedModuleInstance.js - Reanimated (>=4.6.0, incl. stable) throws from
    // `setCSSEventHandler` on the JS-only backend Jest uses, which breaks importing its own mock.
    // Mapped (rather than jest.mock'd) so it applies in the automock registry too, and so it is not
    // overridden by suites that register their own react-native-reanimated mock.
    reanimatedModuleInstance$: '<rootDir>/__mocks__/reanimatedModuleInstance.js',
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
  transformIgnorePatterns: ['node_modules/!(react-native-reanimated)'],
  verbose: true,
};
