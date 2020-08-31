// eslint-disable-next-line no-undef
module.exports = {
  moduleNameMapper: {
    '@stream-io/styled-components':
      '<rootDir>/node_modules/@stream-io/styled-components/native/dist/styled-components.native.cjs.js',
    'mock-builders(.*)$': '<rootDir>/src/mock-builders$1',
  },
  preset: 'react-native',
  setupFiles: [
    require.resolve('./jest-setup.js'),
    './src/mock-builders/native/react-native-mock.js',
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
  verbose: true,
};
