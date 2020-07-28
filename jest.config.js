const jestPreset = require('@testing-library/react-native/jest-preset');

module.exports = Object.assign(jestPreset, {
  testRegex: [
    /**
     * If you want to test single file, mention it here
     * e.g.,
     * "src/components/ChannelList/__tests__/ChannelList.test.js",
     * "src/components/MessageList/__tests__/MessageList.test.js"
     */
  ],
  testPathIgnorePatterns: ['/node_modules/', '/examples/', '__snapshots__'],
  moduleNameMapper: {
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
    '@stream-io/styled-components':
      '<rootDir>/node_modules/@stream-io/styled-components/native/dist/styled-components.native.cjs.js',
  },
  setupFiles: [...jestPreset.setupFiles, require.resolve('./jest-setup.js')],
});
